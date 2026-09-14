<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageThread;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        return response()->json([
            'unread_count' => $this->countUnreadFor($user),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $threads = MessageThread::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
            ->with(['participants:id,name,role', 'messages' => fn ($q) => $q->latest('id')->limit(1)->with('user:id,name,role')])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (MessageThread $thread) => $this->serializeThread($thread, $user, false));

        return response()->json([
            'threads' => $threads,
            'unread_count' => $this->countUnreadFor($user),
        ]);
    }

    public function show(Request $request, MessageThread $thread): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);
        $this->assertParticipant($thread, $user);

        $thread->load(['participants:id,name,role', 'messages.user:id,name,role']);

        DB::table('message_thread_participants')
            ->where('thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now(), 'updated_at' => now()]);

        return response()->json([
            'thread' => $this->serializeThread($thread->fresh(['participants:id,name,role', 'messages.user:id,name,role']), $user, true),
            'unread_count' => $this->countUnreadFor($user),
        ]);
    }

    public function storeMessage(Request $request, MessageThread $thread): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);
        $this->assertParticipant($thread, $user);

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:1', 'max:5000'],
        ]);

        $message = Message::query()->create([
            'thread_id' => $thread->id,
            'user_id' => $user->id,
            'body' => trim($validated['body']),
        ]);

        $thread->forceFill(['last_message_at' => now()])->save();

        DB::table('message_thread_participants')
            ->where('thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now(), 'updated_at' => now()]);

        $thread->load(['participants:id,name,role', 'messages.user:id,name,role']);

        return response()->json([
            'message' => $this->serializeMessage($message->load('user:id,name,role')),
            'thread' => $this->serializeThread($thread, $user, true),
            'unread_count' => $this->countUnreadFor($user),
        ], 201);
    }

    private function assertParticipant(MessageThread $thread, User $user): void
    {
        $ok = $thread->participants()->where('users.id', $user->id)->exists();
        abort_unless($ok, 403);
    }

    private function countUnreadFor(User $user): int
    {
        $rows = DB::table('message_thread_participants')
            ->where('user_id', $user->id)
            ->get(['thread_id', 'last_read_at']);

        $total = 0;
        foreach ($rows as $row) {
            $query = Message::query()
                ->where('thread_id', $row->thread_id)
                ->where('user_id', '!=', $user->id);
            if ($row->last_read_at) {
                $query->where('created_at', '>', Carbon::parse($row->last_read_at));
            }
            $total += (int) $query->count();
        }

        return $total;
    }

    private function serializeThread(MessageThread $thread, User $user, bool $withMessages): array
    {
        $pivot = DB::table('message_thread_participants')
            ->where('thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->first();

        $unreadQuery = Message::query()
            ->where('thread_id', $thread->id)
            ->where('user_id', '!=', $user->id);
        if ($pivot?->last_read_at) {
            $unreadQuery->where('created_at', '>', Carbon::parse($pivot->last_read_at));
        }
        $unread = (int) $unreadQuery->count();

        $last = $thread->relationLoaded('messages')
            ? $thread->messages->sortByDesc('id')->first()
            : $thread->messages()->latest('id')->with('user:id,name,role')->first();

        $payload = [
            'id' => $thread->id,
            'subject' => $thread->subject,
            'course_title' => $thread->course_title,
            'participants' => $thread->participants->map(fn (User $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'role' => $p->role,
            ])->values(),
            'unread' => $unread,
            'updated_at' => optional($thread->last_message_at ?? $thread->updated_at)->toISOString(),
            'last_message' => $last ? $this->serializeMessage($last) : null,
        ];

        if ($withMessages) {
            $messages = $thread->relationLoaded('messages')
                ? $thread->messages->sortBy('id')->values()
                : $thread->messages()->with('user:id,name,role')->orderBy('id')->get();
            $payload['messages'] = $messages->map(fn (Message $m) => $this->serializeMessage($m))->values();
        }

        return $payload;
    }

    private function serializeMessage(Message $message): array
    {
        return [
            'id' => $message->id,
            'thread_id' => $message->thread_id,
            'body' => $message->body,
            'created_at' => optional($message->created_at)->toISOString(),
            'user' => [
                'id' => $message->user?->id,
                'name' => $message->user?->name,
                'role' => $message->user?->role,
            ],
        ];
    }
}

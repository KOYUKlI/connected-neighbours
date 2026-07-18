import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AuthUser } from '../../../api/auth';
import { getNeighbours } from '../../../api/auth';
import {
  createConversation,
  getMessages,
  getMyConversations,
  getUploadUrl,
  markConversationRead,
  sendMessage,
  uploadFile,
} from '../../../api/messaging';
import type {
  ConversationItem,
  ConversationReadPayload,
  MessageItem,
} from '../../../api/messaging';
import { useAuth } from '../../../auth/useAuth';
import { getErrorMessage } from '../../../shared/utils/errors';
import { useMessagingSocket } from './useMessagingSocket';
import type { VoiceRecording } from './useVoiceRecorder';

export function useMessagingWidget() {
  const { token, currentUser } = useAuth();
  const socketRef = useMessagingSocket(token);

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [neighbours, setNeighbours] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = 0;

  const applyReadPayload = useCallback((payload: ConversationReadPayload) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === payload.conversationId
          ? {
              ...conversation,
              lastReadAt: {
                ...conversation.lastReadAt,
                [payload.userId]: payload.readAt,
              },
            }
          : conversation,
      ),
    );
  }, []);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError(null);

    try {
      const result = await getMyConversations();
      setConversations(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadConversations();
    }
  }, [isOpen, loadConversations]);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    conversations.forEach((conversation) => {
      socket.emit('conversation:join', conversation.id);
    });
  }, [conversations, socketRef]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let ignore = false;
    setIsLoadingMessages(true);

    getMessages(selectedConversationId)
      .then((result) => {
        if (!ignore) {
          setMessages(result);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingMessages(false);
        }
      });

    markConversationRead(selectedConversationId)
      .then((payload) => {
        if (!ignore) {
          applyReadPayload(payload);
        }
      })
      .catch(() => undefined);

    const socket = socketRef.current;
    socket?.emit('conversation:join', selectedConversationId);

    return () => {
      ignore = true;
      socket?.emit('conversation:leave', selectedConversationId);
    };
  }, [selectedConversationId, socketRef, applyReadPayload]);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    function handleNewMessage(message: MessageItem) {
      if (message.conversationId === selectedConversationId) {
        markConversationRead(selectedConversationId)
          .then(applyReadPayload)
          .catch(() => undefined);
      }

      setConversations((prev) => {
        const next = prev.map((conversation) =>
          conversation.id === message.conversationId
            ? { ...conversation, lastMessage: message }
            : conversation,
        );

        const touched = next.find((c) => c.id === message.conversationId);

        if (!touched) {
          return next;
        }

        return [touched, ...next.filter((c) => c.id !== message.conversationId)];
      });

      setMessages((prev) => {
        if (prev.some((existing) => existing.id === message.id)) {
          return prev;
        }

        return message.conversationId === selectedConversationId
          ? [...prev, message]
          : prev;
      });
    }

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:read', applyReadPayload);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:read', applyReadPayload);
    };
  }, [socketRef, selectedConversationId, applyReadPayload]);

  const openWidget = useCallback(() => setIsOpen(true), []);
  const closeWidget = useCallback(() => {
    setIsOpen(false);
    setSelectedConversationId(null);
  }, []);
  const toggleWidget = useCallback(() => setIsOpen((prev) => !prev), []);

  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const backToList = useCallback(() => setSelectedConversationId(null), []);

  const loadNeighbours = useCallback(async () => {
    setError(null);

    try {
      const result = await getNeighbours();
      setNeighbours(result);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const startConversation = useCallback(
    async (participantIds: string[], title?: string) => {
      setError(null);

      try {
        const conversation = await createConversation({ participantIds, title });
        setConversations((prev) => [
          conversation,
          ...prev.filter((c) => c.id !== conversation.id),
        ]);
        setSelectedConversationId(conversation.id);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [],
  );

  const sendText = useCallback(
    async (body: string) => {
      if (!selectedConversationId || !body.trim()) {
        return;
      }

      setError(null);

      try {
        const message = await sendMessage(selectedConversationId, { body });
        setMessages((prev) =>
          prev.some((existing) => existing.id === message.id) ? prev : [...prev, message],
        );
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [selectedConversationId],
  );

  const sendVocal = useCallback(
    async (recording: VoiceRecording) => {
      if (!selectedConversationId) {
        return;
      }

      setError(null);

      try {
        const fileName = `vocal-${Date.now()}.webm`;
        const { url, objectKey } = await getUploadUrl(fileName, recording.mimeType);
        await uploadFile(url, recording.blob, recording.mimeType);

        const message = await sendMessage(selectedConversationId, {
          type: 'vocal',
          attachment: {
            objectKey,
            mimeType: recording.mimeType,
            fileName,
            durationSeconds: recording.durationSeconds,
          },
        });

        setMessages((prev) =>
          prev.some((existing) => existing.id === message.id) ? prev : [...prev, message],
        );
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [selectedConversationId],
  );

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  return {
    currentUserId: currentUser?.id ?? null,
    isOpen,
    toggleWidget,
    openWidget,
    closeWidget,
    conversations,
    isLoadingConversations,
    selectedConversationId,
    selectedConversation,
    selectConversation,
    backToList,
    messages,
    isLoadingMessages,
    neighbours,
    loadNeighbours,
    startConversation,
    sendText,
    sendVocal,
    error,
    unreadCount,
  };
}

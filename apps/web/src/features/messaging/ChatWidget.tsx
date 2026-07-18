import { useState } from 'react';

import { ConversationList } from './components/ConversationList';
import { ConversationThread } from './components/ConversationThread';
import { NewConversationPanel } from './components/NewConversationPanel';
import { useMessagingWidget } from './hooks/useMessagingWidget';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import './chat-widget.css';

export function ChatWidget() {
  const {
    currentUserId,
    isOpen,
    toggleWidget,
    conversations,
    isLoadingConversations,
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
  } = useMessagingWidget();

  const voiceRecorder = useVoiceRecorder();
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  function handleStartNew() {
    setIsCreatingNew(true);
    void loadNeighbours();
  }

  async function handleCreate(participantIds: string[], title?: string) {
    await startConversation(participantIds, title);
    setIsCreatingNew(false);
  }

  async function handleStopRecording() {
    const recording = await voiceRecorder.stop();

    if (recording) {
      await sendVocal(recording);
    }
  }

  return (
    <div className="chat-widget">
      {isOpen ? (
        <div className="chat-widget-panel">
          {error ? <div className="error-banner compact">{error}</div> : null}

          {isCreatingNew ? (
            <NewConversationPanel
              neighbours={neighbours}
              onCancel={() => setIsCreatingNew(false)}
              onCreate={handleCreate}
            />
          ) : selectedConversation ? (
            <ConversationThread
              conversation={selectedConversation}
              currentUserId={currentUserId}
              isLoading={isLoadingMessages}
              isRecording={voiceRecorder.isRecording}
              messages={messages}
              onBack={backToList}
              onSendText={(body) => void sendText(body)}
              onStartRecording={() => void voiceRecorder.start()}
              onStopRecording={() => void handleStopRecording()}
              recordError={voiceRecorder.error}
            />
          ) : (
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
              isLoading={isLoadingConversations}
              onSelect={selectConversation}
              onStartNew={handleStartNew}
            />
          )}
        </div>
      ) : null}

      <button className="chat-widget-launcher" onClick={toggleWidget} type="button">
        Discussions
        {unreadCount > 0 ? <span className="chat-widget-badge">{unreadCount}</span> : null}
      </button>
    </div>
  );
}

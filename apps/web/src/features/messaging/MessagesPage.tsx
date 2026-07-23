import { useEffect, useState } from 'react';

import { PageContainer } from '../../components/layout/PageContainer';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { PageHeader } from '../../components/ui/PageHeader';
import { ConversationInfoPanel } from './components/ConversationInfoPanel';
import { ConversationSidebar } from './components/ConversationSidebar';
import { ConversationThread } from './components/ConversationThread';
import { NewConversationPanel } from './components/NewConversationPanel';
import { getConversationLabel } from './conversationLabel';
import { useMessaging } from './hooks/useMessaging';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';

function useIsXlUp() {
  const [isXlUp, setIsXlUp] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1280px)');
    const handler = (event: MediaQueryListEvent) => setIsXlUp(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return isXlUp;
}

export function MessagesPage() {
  const {
    currentUserId,
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
  } = useMessaging();

  const voiceRecorder = useVoiceRecorder();
  const isXlUp = useIsXlUp();
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  // Two separate flags: the xl+ column defaults to visible, the small-screen
  // drawer must stay closed until the user explicitly opens it.
  const [isInfoColumnOpen, setIsInfoColumnOpen] = useState(true);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);

  function handleToggleInfo() {
    if (isXlUp) {
      setIsInfoColumnOpen((prev) => !prev);
    } else {
      setIsInfoDrawerOpen((prev) => !prev);
    }
  }

  function handleStartNew() {
    setIsNewConversationOpen(true);
    void loadNeighbours();
  }

  async function handleCreate(participantIds: string[], title?: string) {
    await startConversation(participantIds, title);
    setIsNewConversationOpen(false);
  }

  async function handleStopRecording() {
    const recording = await voiceRecorder.stop();

    if (recording) {
      await sendVocal(recording);
    }
  }

  return (
    <PageContainer className="grid gap-6">
      <PageHeader
        description="Discutez directement avec vos voisins ou retrouvez les échanges liés à un service."
        eyebrow="Échanges entre voisins"
        title="Messages"
      />

      {error ? <ErrorMessage message={error} /> : null}

      <div className="grid h-[75vh] min-h-[560px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_300px]">
        <div className={`min-h-0 border-slate-200 lg:border-r ${selectedConversationId ? 'hidden lg:block' : 'block'}`}>
          <ConversationSidebar
            conversations={conversations}
            currentUserId={currentUserId}
            isLoading={isLoadingConversations}
            onSelect={selectConversation}
            onStartNew={handleStartNew}
            selectedConversationId={selectedConversationId}
          />
        </div>

        <div className={`min-h-0 ${selectedConversationId ? 'block' : 'hidden lg:block'}`}>
          {selectedConversation ? (
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
              onToggleInfo={handleToggleInfo}
              recordError={voiceRecorder.error}
            />
          ) : (
            <div className="grid h-full place-items-center p-6">
              <EmptyState
                icon="message"
                message="Choisissez une conversation dans la liste ou démarrez-en une nouvelle."
                title="Sélectionnez une conversation"
              />
            </div>
          )}
        </div>

        {selectedConversation && isInfoColumnOpen && isXlUp ? (
          <div className="min-h-0 border-l border-slate-200">
            <ConversationInfoPanel
              conversation={selectedConversation}
              currentUserId={currentUserId}
              messages={messages}
            />
          </div>
        ) : null}
      </div>

      <Drawer
        onClose={() => setIsNewConversationOpen(false)}
        open={isNewConversationOpen}
        title="Nouvelle discussion"
      >
        <NewConversationPanel neighbours={neighbours} onCreate={(ids, title) => void handleCreate(ids, title)} />
      </Drawer>

      {selectedConversation ? (
        <Drawer
          onClose={() => setIsInfoDrawerOpen(false)}
          open={isInfoDrawerOpen && !isXlUp}
          title={getConversationLabel(selectedConversation, currentUserId)}
        >
          <ConversationInfoPanel conversation={selectedConversation} currentUserId={currentUserId} messages={messages} />
        </Drawer>
      ) : null}
    </PageContainer>
  );
}

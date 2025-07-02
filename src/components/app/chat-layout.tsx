
'use client';

import React, {useState, useCallback, useMemo, useRef} from 'react';
import {SidebarProvider, SidebarInset} from '@/components/ui/sidebar';
import {ChatHeader} from './chat-header';
import {ChatMessages} from './chat-messages';
import {ChatInput} from './chat-input';
import {useToast} from '@/hooks/use-toast';
import {AppSidebar} from './app-sidebar';
import {actAsAiAgent} from '@/ai/flows/act-as-ai-agent';
import {openRouterChat} from '@/ai/flows/openrouter-chat';
import {AgenticModeControls} from './agentic-mode-controls';

export interface Node {
  id: string;
  type: 'user' | 'assistant' | 'note';
  content: string;
  attachment?: string;
  model?: Model;
}

interface ChatFlow {
  nodes: Node[];
  positions: {[id: string]: {x: number; y: number}};
}

interface MultiFlowState {
  flows: Record<string, ChatFlow>;
  activeFlowId: string;
}

export type Model =
  | 'Gemini Flash'
  | 'DeepSeek R1'
  | 'DeepSeek V3'
  | 'Qwen'
  | 'Nvidia Nemotron 49B'
  | 'Llama 4 Maverick'
  | 'Mistral Small';

export const modelMap: Record<Model, string> = {
  'Gemini Flash': 'googleai/gemini-2.0-flash',
  'DeepSeek R1': 'deepseek/deepseek-r1-0528:free',
  'DeepSeek V3': 'deepseek/deepseek-chat:free',
  Qwen: 'qwen/qwen3-235b-a22b:free',
  'Nvidia Nemotron 49B': 'nvidia/llama-3.3-nemotron-super-49b-v1:free',
  'Llama 4 Maverick': 'meta-llama/llama-4-maverick:free',
  'Mistral Small': 'mistralai/mistral-small-3.1-24b-instruct:free',
};

function useHistoryState<T>(initialState: T) {
  const [state, _setState] = useState(initialState);
  const historyRef = useRef([initialState]);
  const historyIndexRef = useRef(0);

  const setState = useCallback((action: T | ((prevState: T) => T)) => {
    const currentState = historyRef.current[historyIndexRef.current];
    const newState =
      typeof action === 'function'
        ? (action as (prevState: T) => T)(currentState)
        : action;
    
    if (JSON.stringify(newState) === JSON.stringify(currentState)) {
      return;
    }
    
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(newState);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    _setState(newState);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      _setState(historyRef.current[historyIndexRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      _setState(historyRef.current[historyIndexRef.current]);
    }
  }, []);
  
  return {
    state,
    setState,
    undo,
    redo,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
  };
}

export function ChatLayout() {
  const initialFlowId = useMemo(() => `flow-${Date.now()}`, []);
  const {
    state: multiFlowState,
    setState: setMultiFlowState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<MultiFlowState>({
    flows: {
      [initialFlowId]: {nodes: [], positions: {}},
    },
    activeFlowId: initialFlowId,
  });

  const {flows, activeFlowId} = multiFlowState;
  const activeFlow = flows[activeFlowId] || {nodes: [], positions: {}};
  const {nodes, positions} = activeFlow;

  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [selectedModel, setSelectedModel] =
    useState<Model>('Llama 4 Maverick');
  const [isAgenticMode, setIsAgenticMode] = useState(false);
  const {toast} = useToast();

  const handleSendMessage = async (
    userPrompt: string,
    attachmentDataUri?: string
  ) => {
    setIsLoading(true);

    const finalUserPrompt = userPrompt;

    const userMessageId = `msg-${Date.now()}`;
    const userMessage: Node = {
      id: userMessageId,
      type: 'user',
      content: userPrompt, // Show original prompt in the UI
      ...(attachmentDataUri && {attachment: attachmentDataUri}),
    };

    setMultiFlowState(prev => {
      const currentFlow = prev.flows[prev.activeFlowId];
      return {
        ...prev,
        flows: {
          ...prev.flows,
          [prev.activeFlowId]: {
            nodes: [...currentFlow.nodes, userMessage],
            positions: {
              ...currentFlow.positions,
              [userMessageId]: {x: 0, y: currentFlow.nodes.length * 220},
            },
          },
        },
      };
    });

    try {
      let aiResponse = '';
      if (selectedModel === 'Gemini Flash') {
        const result = await actAsAiAgent({
          userPrompt: finalUserPrompt,
          knowledgeBase,
          attachmentDataUri,
          model: modelMap[selectedModel],
        });
        aiResponse = result.response;
      } else {
        const result = await openRouterChat({
          userPrompt: finalUserPrompt,
          model: modelMap[selectedModel],
          attachmentDataUri,
        });
        aiResponse = result.response;
      }

      const assistantMessageId = `msg-${Date.now() + 1}`;
      const assistantMessage: Node = {
        id: assistantMessageId,
        type: 'assistant',
        content: aiResponse,
        model: selectedModel,
      };

      setMultiFlowState(prev => {
        const currentFlow = prev.flows[prev.activeFlowId];
        return {
          ...prev,
          flows: {
            ...prev.flows,
            [prev.activeFlowId]: {
              nodes: [...currentFlow.nodes, assistantMessage],
              positions: {
                ...currentFlow.positions,
                [assistantMessageId]: {
                  x: 0,
                  y: currentFlow.nodes.length * 220,
                },
              },
            },
          },
        };
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to get response from the AI.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      const errorAssistantId = `err-${Date.now()}`;
      const errorAssistantMessage: Node = {
        id: errorAssistantId,
        type: 'assistant',
        content: `Internal Server Error: ${errorMessage}`,
        model: selectedModel,
      };
      setMultiFlowState(prev => {
        const currentFlow = prev.flows[prev.activeFlowId];
        return {
          ...prev,
          flows: {
            ...prev.flows,
            [prev.activeFlowId]: {
              nodes: [...currentFlow.nodes, errorAssistantMessage],
              positions: {
                ...currentFlow.positions,
                [errorAssistantId]: {x: 0, y: currentFlow.nodes.length * 220},
              },
            },
          },
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = () => {
    const noteId = `note-${Date.now()}`;
    const newNote: Node = {id: noteId, type: 'note', content: 'New Note...'};
    setMultiFlowState(prev => {
      const currentFlow = prev.flows[prev.activeFlowId];
      return {
        ...prev,
        flows: {
          ...prev.flows,
          [prev.activeFlowId]: {
            nodes: [...currentFlow.nodes, newNote],
            positions: {
              ...currentFlow.positions,
              [noteId]: {
                x: 100,
                y:
                  currentFlow.nodes.length > 0
                    ? currentFlow.nodes.length * 120
                    : 50,
              },
            },
          },
        },
      };
    });
  };

  const handleUpdateNoteContent = (noteId: string, content: string) => {
    setMultiFlowState(prev => {
      const currentFlow = prev.flows[prev.activeFlowId];
      return {
        ...prev,
        flows: {
          ...prev.flows,
          [prev.activeFlowId]: {
            ...currentFlow,
            nodes: currentFlow.nodes.map(n =>
              n.id === noteId ? {...n, content} : n
            ),
          },
        },
      };
    });
  };

  const setPositionsCallback = useCallback(
    (
      newPositions:
        | {[id: string]: {x: number; y: number}}
        | ((
            prevPositions: {[id: string]: {x: number; y: number}}
          ) => {[id: string]: {x: number; y: number}})
    ) => {
      setMultiFlowState(prev => {
        const currentFlow = prev.flows[prev.activeFlowId];
        return {
          ...prev,
          flows: {
            ...prev.flows,
            [prev.activeFlowId]: {
              ...currentFlow,
              positions:
                typeof newPositions === 'function'
                  ? newPositions(currentFlow.positions)
                  : newPositions,
            },
          },
        };
      });
    },
    [setMultiFlowState, activeFlowId]
  );

  const clearWorkflow = () => {
    setMultiFlowState(prev => {
      const currentFlow = prev.flows[prev.activeFlowId];
      return {
        ...prev,
        flows: {
          ...prev.flows,
          [prev.activeFlowId]: {
            ...currentFlow,
            nodes: [],
            positions: {},
          },
        },
      };
    });
  };

  const resetPositions = () => {
    setMultiFlowState(prev => {
      const currentFlow = prev.flows[prev.activeFlowId];
      return {
        ...prev,
        flows: {
          ...prev.flows,
          [prev.activeFlowId]: {
            ...currentFlow,
            positions: currentFlow.nodes.reduce(
              (acc, node, i) => {
                acc[node.id] = {x: 0, y: i * 220};
                return acc;
              },
              {} as {[id: string]: {x: number; y: number}}
            ),
          },
        },
      };
    });
  };

  const handleNewFlow = () => {
    const newFlowId = `flow-${Date.now()}`;
    setMultiFlowState(prev => ({
      ...prev,
      flows: {
        ...prev.flows,
        [newFlowId]: {nodes: [], positions: {}},
      },
      activeFlowId: newFlowId,
    }));
  };

  const activePath = '/';

  return (
    <SidebarProvider>
      <AppSidebar
        activePath={activePath}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        showModelSelector={true}
      />
      <SidebarInset>
        <div className="flex h-svh flex-col">
          <ChatHeader
            selectedModel={selectedModel}
            setKnowledgeBase={setKnowledgeBase}
            isAgenticMode={isAgenticMode}
            setIsAgenticMode={setIsAgenticMode}
          />
          <ChatMessages
            nodes={nodes}
            isLoading={isLoading}
            isAgenticMode={isAgenticMode}
            positions={positions}
            setPositions={setPositionsCallback}
            onUpdateNoteContent={handleUpdateNoteContent}
          />
          {isAgenticMode && (
            <AgenticModeControls
              onResetPositions={resetPositions}
              onClearWorkflow={clearWorkflow}
              onNewFlow={handleNewFlow}
              onAddNote={handleAddNote}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          )}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

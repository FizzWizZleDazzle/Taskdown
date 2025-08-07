import { useState, useCallback } from 'react';
import { 
  AITaskGenerationRequest, 
  AITaskGenerationResponse,
  AIAcceptanceCriteriaRequest,
  AIStoryPointEstimationRequest,
  AIDependencyAnalysisRequest,
  AIDependencyAnalysisResponse,
  AISprintPlanningRequest,
  AISprintPlanningResponse
} from '../types';
import { IRemoteWorkspaceClient } from '../remoteClient';

export interface AIServiceState {
  loading: boolean;
  error: string | null;
}

export interface AIServiceHook {
  state: AIServiceState;
  generateTaskDetails: (request: AITaskGenerationRequest) => Promise<AITaskGenerationResponse | null>;
  generateAcceptanceCriteria: (request: AIAcceptanceCriteriaRequest) => Promise<string[] | null>;
  estimateStoryPoints: (request: AIStoryPointEstimationRequest) => Promise<number | null>;
  analyzeDependencies: (request: AIDependencyAnalysisRequest) => Promise<AIDependencyAnalysisResponse | null>;
  planSprint: (request: AISprintPlanningRequest) => Promise<AISprintPlanningResponse | null>;
  clearError: () => void;
}

export const useAIService = (remoteClient?: IRemoteWorkspaceClient): AIServiceHook => {
  const [state, setState] = useState<AIServiceState>({
    loading: false,
    error: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const generateTaskDetails = useCallback(async (request: AITaskGenerationRequest): Promise<AITaskGenerationResponse | null> => {
    if (!remoteClient) {
      setError('AI features are only available for remote workspaces');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await remoteClient.generateTaskDetails(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate task details';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [remoteClient, setLoading, setError]);

  const generateAcceptanceCriteria = useCallback(async (request: AIAcceptanceCriteriaRequest): Promise<string[] | null> => {
    if (!remoteClient) {
      setError('AI features are only available for remote workspaces');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await remoteClient.generateAcceptanceCriteria(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate acceptance criteria';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [remoteClient, setLoading, setError]);

  const estimateStoryPoints = useCallback(async (request: AIStoryPointEstimationRequest): Promise<number | null> => {
    if (!remoteClient) {
      setError('AI features are only available for remote workspaces');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await remoteClient.estimateStoryPoints(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to estimate story points';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [remoteClient, setLoading, setError]);

  const analyzeDependencies = useCallback(async (request: AIDependencyAnalysisRequest): Promise<AIDependencyAnalysisResponse | null> => {
    if (!remoteClient) {
      setError('AI features are only available for remote workspaces');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await remoteClient.analyzeDependencies(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze dependencies';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [remoteClient, setLoading, setError]);

  const planSprint = useCallback(async (request: AISprintPlanningRequest): Promise<AISprintPlanningResponse | null> => {
    if (!remoteClient) {
      setError('AI features are only available for remote workspaces');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await remoteClient.planSprint(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to plan sprint';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [remoteClient, setLoading, setError]);

  return {
    state,
    generateTaskDetails,
    generateAcceptanceCriteria,
    estimateStoryPoints,
    analyzeDependencies,
    planSprint,
    clearError
  };
};
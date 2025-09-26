export interface AIAnalysisResponse {
  success: boolean;
  data: {
    project_id: string;
    recommendation: 'approved' | 'rejected';
    fraud_score: number;
    risk_level: 'Low' | 'Medium' | 'High';
    minimum_quorum: string; // e.g., "75%"
    key_reasons: string[];
  };
}

export interface AIAnalysisRequest {
  projectId: string;
  text: string;
  docFile: File;
}

/**
 * Call AI analysis API to analyze proposal
 */
export async function analyzeProposal(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const formData = new FormData();
  formData.append('project_id', request.projectId);
  formData.append('text', request.text);
  
  // Append file directly
  formData.append('docs', request.docFile, request.docFile.name);

  const response = await fetch('https://transparent-charity-dao-be-production.up.railway.app/api/proposals/analyze', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'accept': 'application/json',
      // Don't set Content-Type, let browser set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    // Try to get error details
    let errorDetails = '';
    try {
      const errorText = await response.text();
      errorDetails = errorText;
      console.error('AI Analysis Error Details:', errorText);
    } catch {
      console.error('Could not read error response');
    }
    
    throw new Error(`AI analysis failed: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
  }

  const result = await response.json();
  return result as AIAnalysisResponse;
}

/**
 * Extract quorum percentage from AI response
 * Converts "75%" to 75
 */
export function extractQuorumPercentage(quorumString: string): number {
  const match = quorumString.match(/(\d+)%/);
  if (!match) {
    throw new Error(`Invalid quorum format: ${quorumString}`);
  }
  return parseInt(match[1], 10);
}

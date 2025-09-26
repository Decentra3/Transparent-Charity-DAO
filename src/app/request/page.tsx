'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  Upload, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Users,
  Brain,
  Clock,
  TrendingUp,
  Target,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { uploadToPinata } from '@/lib/upload';
import { createRequestFund, createProjectOnChain, BASESCAN_BASE_URL, getFundBalance } from '@/lib/contract';
import { generateUniqueId } from '@/lib/utils/id-generator';
import { analyzeProposal, extractQuorumPercentage, type AIAnalysisResponse } from '@/lib/api/ai-analysis';

type RequestType = 'request' | 'crowdfunding';


export default function RequestPage() {
  return (
      <RequestPageContent />
  );
}

function RequestPageContent() {
  const [requestType, setRequestType] = useState<RequestType>('request');
  const searchParams = useSearchParams();
  useEffect(() => {
    const t = (searchParams?.get('type') || '').toLowerCase();
    if (t === 'request' || t === 'crowdfunding') {
      setRequestType(t as RequestType);
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    amount: '',
    reason: '', // title for crowdfunding (<=50 chars)
    description: '', // (<=100 chars)
    evidence: [] as File[],
    campaignDuration: '30' // For crowdfunding
  });
  const [errors, setErrors] = useState<{ amount?: string; reason?: string; description?: string; evidence?: string; upload?: string; submit?: string }>({});
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [uploadedCids, setUploadedCids] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { isConnected, connectWallet } = useWallet();

  const handleInputChange = (field: string, value: string) => {
    setErrors(prev => ({ ...prev, submit: undefined }))
    if (field === 'reason') {
      if (value.length > 50) return;
    }
    if (field === 'description') {
      if (value.length > 100) return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setErrors(prev => ({ ...prev, upload: undefined }))
    
    // Validate file type - only allow .docx
    const invalidFiles = files.filter(file => !file.name.toLowerCase().endsWith('.docx'));
    if (invalidFiles.length > 0) {
      setErrors(prev => ({ ...prev, upload: 'Only .docx files are allowed' }));
      return;
    }
    
    // Only allow 1 file
    if (files.length > 1) {
      setErrors(prev => ({ ...prev, upload: 'Only 1 file is allowed' }));
      return;
    }
    
    // Replace existing files with new file (only 1 file allowed)
    setFormData(prev => ({ ...prev, evidence: files }));
    setUploadProgress(Array(files.length).fill(0))
    const newCids: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const idx = i
      try {
        const { cid } = await uploadToPinata(files[i], (p) => {
          setUploadProgress(prev => {
            const cp = [...prev];
            cp[idx] = p;
            return cp;
          })
        })
        newCids.push(cid)
      } catch (e) {
        setErrors(prev => ({ ...prev, upload: (e as Error)?.message || 'Upload failed' }))
      }
    }
    setUploadedCids(newCids)
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const runAIAnalysis = async () => {
    if (formData.evidence.length === 0) {
      setAnalysisError('Please upload a .docx file for AI analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysis(null);

    try {
      const projectId = generateUniqueId(requestType === 'request' ? 'request' : 'project');
      console.log('projectId', projectId);
      const docFile = formData.evidence[0]; // We only allow 1 file now
      const text = requestType === 'request' 
        ? formData.description.slice(0, 500) // Limit text length
        : `${formData.reason}: ${formData.description}`.slice(0, 500);

      // Validate required fields
      if (!text || text.trim().length === 0) {
        setAnalysisError('Please provide description text for analysis');
        return;
      }

      if (!docFile || docFile.size === 0) {
        setAnalysisError('Please upload a valid .docx file');
        return;
      }


      const result = await analyzeProposal({
        projectId,
        text,
        docFile
      });

      setAiAnalysis(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    const newErrors: typeof errors = {}
    if (!formData.amount) newErrors.amount = 'Amount is required'
    
    // Amount validation based on type
    const amount = parseFloat(formData.amount)
    if (requestType === 'request') {
      if (amount > 500) newErrors.amount = 'Request fund maximum is 500 USDT'
    } else if (requestType === 'crowdfunding') {
      if (amount < 500) newErrors.amount = 'Crowdfunding minimum is 500 USDT'
    }
    
    // File upload validation - mandatory
    if (formData.evidence.length === 0) {
      newErrors.evidence = 'A .docx file is required'
    }

    // AI analysis validation - mandatory
    if (!aiAnalysis) {
      newErrors.submit = 'Please run AI analysis first'
    }
    
    if (requestType === 'crowdfunding') {
      if (!formData.reason) newErrors.reason = 'Title is required'
      if (formData.reason.length > 50) newErrors.reason = 'Max 50 characters'
      if (formData.description.length > 100) newErrors.description = 'Max 100 characters'
    } else {
      // request fund: no title, require description (as contract only has description)
      if (!formData.description) newErrors.description = 'Reason/Description is required'
      if (formData.description.length > 100) newErrors.description = 'Max 100 characters'
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return;

    // validate lengths
    if (requestType === 'crowdfunding' && formData.reason.length > 50) return;
    if (formData.description.length > 100) return;

    setIsSubmitting(true);
    try {
      // Freshly validate treasury balance for request fund
      if (requestType === 'request') {
        try {
          const currentFund = await getFundBalance()
          const req = parseFloat(formData.amount || '0')
          const available = parseFloat(currentFund || '0')
          if (req > available) {
            setErrors(prev => ({ ...prev, amount: `Amount exceeds fund balance (available $${available.toFixed(2)} USDT)` }))
            return
          }
        } catch {
          // If fund check fails, let on-chain revert provide message
        }
      }
      if (!aiAnalysis) {
        setErrors(prev => ({ ...prev, submit: 'Please run AI analysis first' }));
        return;
      }

      const amount = formData.amount;
      const description = formData.description.slice(0, 100);
      const title = formData.reason.slice(0, 50);
      const proofHash = uploadedCids[0] || '';
      const quorum = extractQuorumPercentage(aiAnalysis.data.minimum_quorum);

      if (requestType === 'request') {
        // Generate unique request ID
        const requestId = generateUniqueId('request');
        const { hash } = await createRequestFund(requestId, amount, description || 'Request', proofHash, quorum);
        setTxHash(hash as string);
      } else {
        // Generate unique project ID
        const projectId = generateUniqueId('project');
        const { hash } = await createProjectOnChain(projectId, title, description, proofHash, amount, parseInt(formData.campaignDuration || '30', 10), quorum);
        setTxHash(hash as string);
      }
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ amount: '', reason: '', description: '', evidence: [], campaignDuration: '30' });
    setShowSuccess(false);
    setAiAnalysis(null);
    setRequestType('request');
    setUploadedCids([]);
    setUploadProgress([]);
    setTxHash(null);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen pt-8 pb-16 bg-[hsl(var(--background))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-card border border-border">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4">
                  {requestType === 'request' 
                    ? 'Request Submitted Successfully!' 
                    : 'Campaign Created Successfully!'
                  }
                </h2>
                <p className="text-muted-foreground mb-6">
                  {requestType === 'request' 
                    ? `Your request for $${formData.amount} USDT has been submitted to the DAO for review.`
                    : `Your crowdfunding campaign with a goal of $${formData.amount} USDT has been created and will be live for ${formData.campaignDuration} days.`
                  }
                </p>
                
                {txHash && (
                  <div className="bg-accent p-6 rounded-lg mb-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Your submission is on-chain. Track it here:</p>
                    <a href={`${BASESCAN_BASE_URL}/tx/${txHash}`} target="_blank" className="text-primary hover:underline break-all">{txHash}</a>
                  </div>
                )}
                
                <div className="space-y-3 mb-6">
                  {requestType === 'request' ? (
                    <>
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        Estimated review time: 2-3 days
                      </div>
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        Your request will be reviewed by DAO members
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Heart className="h-4 w-4 mr-2 text-primary" />
                        Campaign will be live after DAO approval
                      </div>
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                        Community members can donate requestly to your campaign
                      </div>
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Target className="h-4 w-4 mr-2 text-primary" />
                        Funds are released automatically when received
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={resetForm} variant="outline">
                    {requestType === 'request' ? 'Submit Another Request' : 'Create Another Campaign'}
                  </Button>
                  <Button onClick={() => window.location.href = requestType === 'request' ? '/projects/requests' : '/projects/crowdfunding'}>
                  {requestType === 'request' ? 'View all requests' : 'View all crowdfunding campaigns'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-16 bg-[hsl(var(--background))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-4 bg-transparent text-primary border-border">
            🙏 Request Support
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Request Financial Help
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Submit your request for financial assistance. Our DAO community and AI systems 
            will review your case to ensure transparency and legitimate need.
          </p>
        </motion.div>

        {/* Request Type Selection */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Card 
              className={`cursor-pointer transition-all duration-200 bg-card border ${
                requestType === 'request' 
                  ? 'ring-2 ring-primary' 
                  : 'border-border hover:shadow-md'
              }`}
              onClick={() => setRequestType('request')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Request Fund</h3>
                <p className="text-muted-foreground text-sm">
                  Request immediate funding from the DAO treasury. 
                  Fast approval for urgent needs.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center"><Clock className="h-3 w-3 mr-1" />
                  2-3 days review</div>
                  <div className="flex items-center font-bold text-primary"><DollarSign className="h-3 w-3 mr-1" />
                     Max 500 USDT
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-200 bg-card border ${
                requestType === 'crowdfunding' 
                  ? 'ring-2 ring-primary' 
                  : 'border-border hover:shadow-md'
              }`}
              onClick={() => setRequestType('crowdfunding')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Crowdfunding</h3>
                <p className="text-muted-foreground text-sm">
                  Launch a community campaign. Community members 
                  donate requestly to your cause.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center"><TrendingUp className="h-3 w-3 mr-1" />
                  Campaign-based</div>
                  <div className="flex items-center font-bold text-primary"><DollarSign className="h-3 w-3 mr-1" />
                     Min 500 USDT
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <span>
                    {requestType === 'request' ? 'Request Fund Request' : 'Crowdfunding Campaign'}
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {requestType === 'request' 
                    ? 'Submit a request for immediate funding from the DAO treasury'
                    : 'Create a crowdfunding campaign for community donations'
                  }
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {requestType === 'request' ? 'Amount Needed (USDT)' : 'Funding Goal (USDT)'} *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder={requestType === 'request' ? 'Enter amount needed' : 'Enter funding goal'}
                      className="pl-10 text-sm"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                  {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
                  {requestType === 'crowdfunding' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Set a realistic goal. Campaigns receive funds even if goal isn&apos;t fully met.
                    </p>
                  )}
                </div>

                {/* Campaign Duration - Only for Crowdfunding */}
                {requestType === 'crowdfunding' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Campaign Duration (Days) *
                    </label>
                    <Input
                      type="number"
                      value={formData.campaignDuration}
                      onChange={(e) => handleInputChange('campaignDuration', e.target.value)}
                      placeholder="30"
                      min="7"
                      max="365"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How long should your campaign run? (7-365 days)
                    </p>
                  </div>
                )}

                {/* Title (only for Crowdfunding) */}
                {requestType === 'crowdfunding' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Campaign Title *
                    </label>
                    <Input
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="e.g., Help Sarah with Medical Treatment, Support Local School"
                      required
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className={formData.reason.length > 50 ? 'text-red-600' : 'text-muted-foreground'}>
                        {formData.reason.length}/50
                      </span>
                      {errors.reason && <span className="text-red-600">{errors.reason}</span>}
                    </div>
                  </div>
                )}

                {/* Description with live counter (required for Request, optional for Crowdfunding) */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {requestType === 'request' ? 'Reason / Description *' : 'Campaign Description (optional)'}
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={requestType === 'request' ? 'Describe why you need help and how funds will be used' : 'Provide brief details about your campaign'}
                    rows={4}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span className={formData.description.length > 100 ? 'text-red-600' : 'text-muted-foreground'}>
                      {formData.description.length}/100
                    </span>
                    {errors.description && <span className="text-red-600">{errors.description}</span>}
                  </div>
                </div>

                 {/* Evidence Upload (upload to IPFS immediately) */}
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Supporting Evidence *
                   </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                  <div className="text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload supporting document (.docx only, max 1 file)
                        {formData.evidence.length === 0 && (
                          <span className="text-destructive ml-1">(Required)</span>
                        )}
                      </p>
                      <input
                        type="file"
                        accept=".docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="evidence-upload"
                      />
                      <label htmlFor="evidence-upload">
                        <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                          <span>Choose File</span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">
                        Max 1 file, 10MB (DOCX only)
                      </p>
                       {errors.upload && <p className="text-xs text-red-600 mt-1">{errors.upload}</p>}
                       {errors.evidence && <p className="text-xs text-red-600 mt-1">{errors.evidence}</p>}
                     </div>
                   </div>

                  {/* Uploaded Files with progress */}
                  {formData.evidence.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.evidence.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            {uploadedCids[index] && (
                              <span className="text-xs text-primary">CID: {uploadedCids[index].slice(0, 10)}...</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {typeof uploadProgress[index] === 'number' && uploadProgress[index] < 100 && (
                              <div className="w-24 h-2 bg-muted rounded">
                                <div className="h-2 bg-primary rounded" style={{ width: `${uploadProgress[index]}%` }} />
                              </div>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Analysis Section */}
                {formData.evidence.length > 0 && (
                  <div className="mt-6 p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium flex items-center">
                          <Brain className="h-4 w-4 mr-2 text-primary" />
                          AI Analysis
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Analyze your proposal for fraud risk and get recommended quorum
                        </p>
                      </div>
                      <Button
                        onClick={runAIAnalysis}
                        disabled={isAnalyzing || formData.evidence.length === 0}
                        size="sm"
                        className="ml-4"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Run Analysis
                          </>
                        )}
                      </Button>
                    </div>

                    {analysisError && (
                      <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{analysisError}</p>
                      </div>
                    )}

                    {aiAnalysis && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-accent rounded-lg">
                            <p className="text-xs text-muted-foreground">Recommendation</p>
                            <p className={`font-medium ${
                              aiAnalysis.data.recommendation === 'approved' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {aiAnalysis.data.recommendation === 'approved' ? 'Approved' : 'Rejected'}
                            </p>
                          </div>
                          <div className="p-3 bg-accent rounded-lg">
                            <p className="text-xs text-muted-foreground">Fraud Score</p>
                            <p className={`font-medium ${
                              aiAnalysis.data.fraud_score < 30 
                                ? 'text-green-600' 
                                : aiAnalysis.data.fraud_score < 70 
                                  ? 'text-yellow-600' 
                                  : 'text-red-600'
                            }`}>
                              {aiAnalysis.data.fraud_score}%
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-accent rounded-lg">
                          <p className="text-xs text-muted-foreground">Risk Level</p>
                          <p className={`font-medium ${
                            aiAnalysis.data.risk_level === 'Low' 
                              ? 'text-green-600' 
                              : aiAnalysis.data.risk_level === 'Medium' 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                          }`}>
                            {aiAnalysis.data.risk_level}
                          </p>
                        </div>

                        <div className="p-3 bg-accent rounded-lg">
                          <p className="text-xs text-muted-foreground">Recommended Quorum</p>
                          <p className="font-medium text-primary">{aiAnalysis.data.minimum_quorum}</p>
                        </div>

                        {aiAnalysis.data.key_reasons.length > 0 && (
                          <div className="p-3 bg-accent rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">Key Reasons</p>
                            <ul className="space-y-1">
                              {aiAnalysis.data.key_reasons.map((reason, index) => (
                                <li key={index} className="text-sm text-muted-foreground">
                                  • {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                 <Button
                   onClick={handleSubmit}
                   disabled={
                     isSubmitting ||
                     !formData.amount ||
                     formData.evidence.length === 0 ||
                     !aiAnalysis ||
                     (requestType === 'crowdfunding' && (!formData.reason || formData.reason.length > 50)) ||
                     (requestType === 'request' && !formData.description) ||
                     formData.description.length > 100
                   }
                  className="w-full text-sm py-4"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {aiAnalysis ? 'Submitting...' : 'Analyzing with AI...'}
                    </>
                  ) : !isConnected ? (
                    'Connect Wallet to Submit'
                  ) : (
                    <>
                      <HelpCircle className="mr-2 h-5 w-5" />
                      Submit Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Guidelines & Tips */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Review Process (Request) */}
            {requestType === 'request' && (
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-lg">Review Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Your request is automatically analyzed for legitimacy and risk factors
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">DAO Voting</h4>
                    <p className="text-sm text-muted-foreground">
                      DAO members review and vote on your request based on merit and need
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Disbursement</h4>
                    <p className="text-sm text-muted-foreground">
                      Approved requests receive funds requestly through blockchain
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Crowdfunding Process */}
            {requestType === 'crowdfunding' && (
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-lg">Crowdfunding Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Your campaign is automatically analyzed for risk and completeness
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">DAO Voting</h4>
                    <p className="text-sm text-muted-foreground">
                      DAO members vote to approve the campaign before opening to public
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Public Donation</h4>
                    <p className="text-sm text-muted-foreground">
                      Once approved, everyone can donate USDT to support the campaign until target is met or deadline passes
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Disbursement</h4>
                    <p className="text-sm text-muted-foreground">
                      Funds are transferred to the owner when the owner close the campaign
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Tips for Success */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  Tips for Success
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Be honest and transparent about your situation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Provide detailed explanations and context</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Upload relevant supporting documents</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Request reasonable amounts based on actual need</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Respond promptly to DAO member questions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                  Important Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All requests are subject to AI analysis and community review. 
                  Fraudulent requests will be rejected and may result in account suspension. 
                  Only submit legitimate requests for actual financial need.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

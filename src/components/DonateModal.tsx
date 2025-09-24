'use client';

import { useState } from 'react';
import { donateToProject } from '@/lib/contract';
import { X, DollarSign, Heart, Loader2, CheckCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { formatUSDT } from '@/lib/utils';

interface Project {
  id: string;
  amount: number;
  reason: string;
  type: 'request' | 'crowdfunding';
  currentAmount?: number;
  beneficiaryAddress: string;
  evidence?: string[];
}

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export function DonateModal({ isOpen, onClose, project }: DonateModalProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { isConnected, connectWallet } = useWallet();

  if (!isOpen) return null;

  const progress = project.currentAmount ? (project.currentAmount / project.amount) * 100 : 0;
  const remaining = project.amount - (project.currentAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    // Check wallet connection first
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsSubmitting(true);
    try {
      await donateToProject(BigInt(project.id), amount);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setAmount('');
        setMessage('');
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedAmounts = [10, 25, 50, 100];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Donate to Project #{project.id}
                </h2>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mt-1">
                  Crowdfunding
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isSuccess ? (
            /* Success State */
            <div className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Donation Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Thank you for your generous contribution of ${formatUSDT(parseFloat(amount))}
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  Your donation is being processed and will be added to the project funds shortly.
                </p>
              </div>
            </div>
          ) : (
            /* Donation Form */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Project Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Project Details</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {project.reason}
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      ${formatUSDT(project.currentAmount || 0)} / ${formatUSDT(project.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(progress, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{Math.round(progress)}% completed</span>
                    <span>${formatUSDT(remaining)} remaining</span>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Donation Amount (USDT)
                </label>
                
                {/* Suggested Amounts */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {suggestedAmounts.map((suggestedAmount) => (
                    <Button
                      key={suggestedAmount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(suggestedAmount.toString())}
                      className={amount === suggestedAmount.toString() ? 'border-purple-500 bg-purple-50' : ''}
                    >
                      ${suggestedAmount}
                    </Button>
                  ))}
                </div>

                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Optional Message */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message of support..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : !isConnected ? (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Donate ${amount || '0'}
                    </>
                  )}
                </Button>
              </div>

              {/* Security Note */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  🔒 Your donation is secured by blockchain technology and will be transparently tracked.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { X, DollarSign, TrendingUp, Handshake, CreditCard } from 'lucide-react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { projectAPI, type ProjectInvestmentCreate } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface Project {
  id: number;
  title: string;
  description: string;
  funding_status: string;
  funding_amount: number;
  funding_goal: number;
  created_by: number;
}

interface InvestmentModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onInvestmentSuccess: () => void;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ 
  project, 
  isOpen, 
  onClose, 
  onInvestmentSuccess 
}) => {
  const [formData, setFormData] = useState<Omit<ProjectInvestmentCreate, 'project_id'>>({
    investor_name: '',
    investor_email: '',
    investor_phone: '',
    investment_amount: 0,
    investment_type: 'equity',
    equity_percentage: 0,
    expected_returns: '',
    terms_conditions: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const investmentTypes = [
    { 
      value: 'equity', 
      label: 'Equity Investment', 
      description: 'Buy shares in the company',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    { 
      value: 'loan', 
      label: 'Loan', 
      description: 'Provide debt financing',
      icon: CreditCard,
      color: 'text-blue-500'
    },
    { 
      value: 'grant', 
      label: 'Grant', 
      description: 'Non-repayable funding',
      icon: DollarSign,
      color: 'text-purple-500'
    },
    { 
      value: 'partnership', 
      label: 'Partnership', 
      description: 'Strategic business partnership',
      icon: Handshake,
      color: 'text-orange-500'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.investor_name || !formData.investor_phone || !formData.investment_amount || !formData.expected_returns) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.investment_amount <= 0) {
      toast.error('Investment amount must be greater than 0');
      return;
    }

    if (formData.investment_type === 'equity' && (
      !formData.equity_percentage || 
      formData.equity_percentage <= 0 || 
      formData.equity_percentage > 100
    )) {
      toast.error('Equity percentage must be between 1-100%');
      return;
    }

    setLoading(true);

    try {
      const response = await projectAPI.createInvestment({
        ...formData,
        project_id: project.id
      });

      if (response.data) {
        toast.success('Investment proposal submitted successfully!');
        onInvestmentSuccess();
        onClose();
      } else {
        toast.error(response.error || 'Failed to submit investment proposal');
      }
    } catch (error) {
      console.error('Investment error:', error);
      toast.error('Failed to submit investment proposal');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            Invest in {project.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Info */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Funding Status:</span>
                  <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                    {project.funding_status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Goal:</span>
                  <span className="ml-2 text-white font-semibold">
                    {formatCurrency(project.funding_goal)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Raised:</span>
                  <span className="ml-2 text-green-400 font-semibold">
                    {formatCurrency(project.funding_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Remaining:</span>
                  <span className="ml-2 text-blue-400 font-semibold">
                    {formatCurrency(project.funding_goal - project.funding_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Investor Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.investor_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, investor_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.investor_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, investor_phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+91 XXXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.investor_email}
                onChange={(e) => setFormData(prev => ({ ...prev, investor_email: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          {/* Investment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Investment Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Investment Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {investmentTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setFormData(prev => ({ ...prev, investment_type: type.value as any }))}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.investment_type === type.value
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`h-5 w-5 ${type.color}`} />
                        <div>
                          <div className="text-white font-medium">{type.label}</div>
                          <div className="text-gray-400 text-xs">{type.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Investment Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.investment_amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, investment_amount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="50000"
                  min="1"
                  required
                />
              </div>

              {formData.investment_type === 'equity' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Equity Percentage (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.equity_percentage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, equity_percentage: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10"
                    min="1"
                    max="100"
                    step="0.1"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expected Returns *
              </label>
              <textarea
                value={formData.expected_returns}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_returns: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Describe what you expect in return for your investment..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Terms & Conditions (Optional)
              </label>
              <textarea
                value={formData.terms_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Any specific terms or conditions for this investment..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message to Project Team (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Tell the team why you want to invest in their project..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Investment Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestmentModal;

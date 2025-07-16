
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  DollarSign,
  TrendingUp,
  User,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Handshake
} from 'lucide-react';
import { projectAPI, type ProjectInvestment } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface InvestmentDetailsProps {
  projectId: number;
  isProjectOwner: boolean;
}

const InvestmentDetails: React.FC<InvestmentDetailsProps> = ({ 
  projectId, 
  isProjectOwner 
}) => {
  const [investments, setInvestments] = useState<ProjectInvestment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('InvestmentDetails mounted for project ID:', projectId, 'isProjectOwner:', isProjectOwner);
    fetchInvestments();
  }, [projectId]);

  const fetchInvestments = async () => {
    try {
      console.log('Fetching investments for project ID:', projectId);
      const response = await projectAPI.getProjectInvestments(projectId);
      console.log('Investment API response:', response);
      if (response.data) {
        console.log('Setting investments:', response.data);
        setInvestments(response.data);
      } else {
        console.log('No data in response:', response);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast.error('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (investmentId: number, status: string, responseMessage?: string) => {
    try {
      const response = await projectAPI.updateInvestmentStatus(
        projectId, 
        investmentId, 
        { status: status as any, response_message: responseMessage }
      );
      
      if (response.data) {
        toast.success(`Investment ${status} successfully`);
        fetchInvestments(); // Refresh the list
      } else {
        toast.error(response.error || 'Failed to update investment status');
      }
    } catch (error) {
      console.error('Error updating investment:', error);
      toast.error('Failed to update investment status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'negotiating':
        return <Handshake className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'negotiating':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getInvestmentTypeIcon = (type: string) => {
    switch (type) {
      case 'equity':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'loan':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'grant':
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      case 'partnership':
        return <Handshake className="h-4 w-4 text-orange-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Investments Yet</h3>
          <p className="text-gray-400">
            No investors have shown interest in this project yet.
          </p>
          <div className="mt-4 text-xs text-gray-500">
            Debug: Project ID = {projectId}, Loading = {loading ? 'true' : 'false'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Investment Proposals ({investments.length})
        </h3>
        <div className="text-sm text-gray-400">
          Total: {formatCurrency(investments.reduce((sum, inv) => sum + inv.investment_amount, 0))}
        </div>
      </div>

      {investments.map((investment) => (
        <Card key={investment.id} className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getInvestmentTypeIcon(investment.investment_type)}
                <div>
                  <CardTitle className="text-white text-lg">
                    {formatCurrency(investment.investment_amount)}
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span className="capitalize">{investment.investment_type}</span>
                    {investment.investment_type === 'equity' && investment.equity_percentage && (
                      <span>• {investment.equity_percentage}% equity</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(investment.status)}
                <Badge className={getStatusColor(investment.status)}>
                  {investment.status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Investor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-white font-medium">{investment.investor_name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{investment.investor_phone}</span>
                </div>
                {investment.investor_email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{investment.investor_email}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">
                    Submitted: {formatDate(investment.invested_at)}
                  </span>
                </div>
                {investment.response_at && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">
                      Responded: {formatDate(investment.response_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expected Returns */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Expected Returns</h4>
              <p className="text-gray-300 text-sm bg-gray-700/50 p-3 rounded-lg">
                {investment.expected_returns}
              </p>
            </div>

            {/* Terms & Conditions */}
            {investment.terms_conditions && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Terms & Conditions</h4>
                <p className="text-gray-300 text-sm bg-gray-700/50 p-3 rounded-lg">
                  {investment.terms_conditions}
                </p>
              </div>
            )}

            {/* Message */}
            {investment.message && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2 flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Message from Investor</span>
                </h4>
                <p className="text-gray-300 text-sm bg-gray-700/50 p-3 rounded-lg">
                  {investment.message}
                </p>
              </div>
            )}

            {/* Response Message */}
            {investment.response_message && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2 flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Response from Project Team</span>
                </h4>
                <p className="text-gray-300 text-sm bg-blue-900/30 p-3 rounded-lg border-l-4 border-blue-500">
                  {investment.response_message}
                </p>
              </div>
            )}

            {/* Action Buttons for Project Owner */}
            {isProjectOwner && investment.status === 'pending' && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    const responseMessage = prompt('Enter response message (optional):');
                    handleStatusUpdate(investment.id, 'accepted', responseMessage || undefined);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    const responseMessage = prompt('Enter reason for rejection (optional):');
                    handleStatusUpdate(investment.id, 'rejected', responseMessage || undefined);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    const responseMessage = prompt('Enter message for negotiation:');
                    if (responseMessage) {
                      handleStatusUpdate(investment.id, 'negotiating', responseMessage);
                    }
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  Negotiate
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InvestmentDetails;

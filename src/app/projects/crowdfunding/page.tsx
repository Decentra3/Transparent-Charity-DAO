'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  User,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Target,
  TrendingUp,
  Heart,
  ChevronDown
} from 'lucide-react';
import { useOnchainStore } from '@/lib/store';
import { getAllProjects } from '@/lib/contract';
import { formatUSDT, formatAddress } from '@/lib/utils';

const getStatusIcon = (project: any) => {
  if (project.closed) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (project.decisionMade && !project.approved) {
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
  if (project.approved) {
    return <TrendingUp className="h-4 w-4 text-blue-500" />;
  }
  return <Clock className="h-4 w-4 text-yellow-500" />;
};

const getStatusText = (project: any) => {
  if (project.closed) {
    return 'Completed';
  }
  if (project.decisionMade && !project.approved) {
    return 'Rejected';
  }
  if (project.approved) {
    return 'Active';
  }
  return 'Voting';
};

const getStatusColor = (project: any) => {
  if (project.closed) {
    return 'default';
  }
  if (project.decisionMade && !project.approved) {
    return 'destructive';
  }
  if (project.approved) {
    return 'secondary';
  }
  return 'outline';
};

export default function CrowdfundingProjectsPage() {
  return <CrowdfundingProjectsPageContent />;
}

function CrowdfundingProjectsPageContent() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { isConnected } = useOnchainStore();

  useEffect(() => {
    loadProjects();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen) {
        const target = event.target as Element;
        if (!target.closest('.relative')) {
          setIsFilterOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log('Loading projects...');
      const allProjects = await getAllProjects();
      
      console.log('Raw projects data:', allProjects);
      console.log('Projects count:', allProjects?.length || 0);
      
      // Handle empty array
      if (!allProjects || allProjects.length === 0) {
        console.log('No projects found');
        setProjects([]);
        return;
      }
      
      // Transform contract data to display format
      const transformedProjects = allProjects.map((project: any) => {
        console.log('Processing project:', project);
        
        // Handle timestamp safely
        const creationTimestamp = project.creationTimestamp ? Number(project.creationTimestamp) * 1000 : Date.now();
        const deadlineTimestamp = project.deadline ? Number(project.deadline) * 1000 : Date.now() + (30 * 24 * 60 * 60 * 1000);
        
        // Validate timestamps
        const createdAt = new Date(creationTimestamp);
        const deadline = new Date(deadlineTimestamp);
        
        if (isNaN(createdAt.getTime())) {
          console.warn('Invalid creation timestamp for project:', project.id, 'using current time');
          createdAt.setTime(Date.now());
        }
        
        if (isNaN(deadline.getTime())) {
          console.warn('Invalid deadline for project:', project.id, 'using 30 days from now');
          deadline.setTime(Date.now() + (30 * 24 * 60 * 60 * 1000));
        }
        
        return {
          id: String(project.id),
          owner: project.owner,
          title: project.title || 'Untitled Project',
          description: project.description || 'No description provided',
          targetAmount: Number(project.targetAmount) / 1e6, // Convert from wei to USDT
          totalFunded: Number(project.totalFunded) / 1e6,
          deadline: deadline.toISOString(),
          createdAt: createdAt.toISOString(),
          approved: project.approved || false,
          decisionMade: project.decisionMade || false,
          closed: project.closed || false,
          approveCount: Number(project.approveCount) || 0,
          rejectCount: Number(project.rejectCount) || 0,
          proofHash: project.proofHash || '',
          // Calculate progress percentage
          progress: project.targetAmount > 0 ? (Number(project.totalFunded) / Number(project.targetAmount)) * 100 : 0,
          // Calculate days remaining
          daysRemaining: Math.max(0, Math.ceil((deadlineTimestamp - Date.now()) / (1000 * 60 * 60 * 24))),
        };
      });
      
      console.log('Transformed projects:', transformedProjects);
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'voting' && !project.decisionMade) ||
      (filterStatus === 'active' && project.approved && !project.closed) ||
      (filterStatus === 'completed' && project.closed) ||
      (filterStatus === 'rejected' && project.decisionMade && !project.approved);
    
    const searchMatch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const statusOptions = [
    { value: 'all', label: 'All Status', icon: <Filter className="h-4 w-4" />, color: 'text-gray-600' },
    { value: 'voting', label: 'Voting', icon: <Clock className="h-4 w-4" />, color: 'text-yellow-600' },
    { value: 'active', label: 'Active', icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-600' },
    { value: 'completed', label: 'Completed', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
    { value: 'rejected', label: 'Rejected', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading crowdfunding projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <Badge className="mb-4 bg-transparent text-primary border-border">
              🚀 Crowdfunding
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Crowdfunding Campaigns
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover and support crowdfunding campaigns created by community members.
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, description, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 min-w-[140px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    {statusOptions.find(opt => opt.value === filterStatus)?.icon}
                    <span>{statusOptions.find(opt => opt.value === filterStatus)?.label}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {isFilterOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilterStatus(option.value);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 transition-colors ${
                            filterStatus === option.value ? 'bg-muted font-medium' : ''
                          }`}
                        >
                          <span className={option.color}>{option.icon}</span>
                          <span>{option.label}</span>
                          {filterStatus === option.value && (
                            <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
              <div className="text-sm text-muted-foreground">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects List */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border border-border bg-card hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={getStatusColor(project)} className="text-sm">
                      {getStatusIcon(project)}
                      <span className="ml-1">{getStatusText(project)}</span>
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-lg line-clamp-2 mb-2">
                    {project.title}
                  </CardTitle>
                  
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 h-full flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    {/* Funding Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(project.progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatUSDT(project.totalFunded)} raised</span>
                        <span>{formatUSDT(project.targetAmount)} goal</span>
                      </div>
                    </div>
                    
                    {/* Owner */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Owner:</span>
                      <span className="font-mono text-xs">
                        {formatAddress(project.owner)}
                      </span>
                    </div>
                    
                    {/* Deadline */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {project.daysRemaining > 0 
                          ? `${project.daysRemaining} days left`
                          : 'Campaign ended'
                        }
                      </span>
                    </div>
                    
                    {/* Voting Progress (if still voting) */}
                    {!project.decisionMade && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">Approve: {project.approveCount}</span>
                          <span className="text-red-600">Reject: {project.rejectCount}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="bg-primary h-1 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${project.approveCount + project.rejectCount > 0 
                                ? (project.approveCount / (project.approveCount + project.rejectCount)) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  
                  </div>
                    {/* Action Button */}
                    <Link href={`/projects/crowdfunding/${project.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full group">
                        {project.approved && !project.closed ? 'Donate Now' : 'View Details'}
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredProjects.length === 0 && !loading && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No crowdfunding projects found</h3>
              <p className="text-sm">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No crowdfunding campaigns have been created yet.'
                }
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

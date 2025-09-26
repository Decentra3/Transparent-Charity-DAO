"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ChevronDown,
} from "lucide-react";
import { getAllRequests } from "@/lib/contract";
import { formatUSDT, formatAddress } from "@/lib/utils";

type ContractRequest = {
  id: bigint;
  beneficiary: string;
  amount: bigint;
  description: string;
  proofHash: string;
  approveCount: bigint;
  rejectCount: bigint;
  paid: boolean;
  done: boolean;
  quorumPercent: number;
  daoDecisionMade: boolean;
  daoApproved: boolean;
  donorVoteDeadline: bigint;
  donorApproveCount: bigint;
  donorRejectCount: bigint;
  creationTimestamp: bigint;
};

type RequestData = {
  id: string;
  beneficiaryAddress: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  approveCount: number;
  rejectCount: number;
  proofHash: string;
  daoDecisionMade: boolean;
  daoApproved: boolean;
  paid: boolean;
  done: boolean;
  quorumPercent: number;
  donorVoteDeadline: number;
  donorApproveCount: number;
  donorRejectCount: number;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "disbursed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "rejected":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "waiting_claim":
      return <Clock className="h-4 w-4 text-orange-500" />;
    case "donor_voting":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "voting":
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "disbursed":
      return "default";
    case "rejected":
      return "destructive";
    case "waiting_claim":
      return "secondary";
    case "donor_voting":
      return "secondary";
    case "voting":
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "voting":
      return "DAO Voting";
    case "donor_voting":
      return "Donor Voting";
    case "waiting_claim":
      return "Waiting Claim";
    case "disbursed":
      return "Disbursed";
    case "rejected":
      return "Rejected";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export default function RequestFundsPage() {
  return <RequestFundsPageContent />;
}

function RequestFundsPageContent() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadRequests();
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

  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log("Loading requests...");
      const allRequests = await getAllRequests();

      console.log("Raw requests data:", allRequests);
      console.log("Requests count:", allRequests?.length || 0);

      // Handle empty array
      if (!allRequests || allRequests.length === 0) {
        console.log("No requests found");
        setRequests([]);
        return;
      }

      // Transform contract data to display format
      const transformedRequests = allRequests.map((req: ContractRequest): RequestData => {
        console.log("Processing request:", req);

        // Handle timestamp safely
        const creationTimestamp = req.creationTimestamp
          ? Number(req.creationTimestamp) * 1000
          : Date.now();

        // Validate timestamp
        const createdAt = new Date(creationTimestamp);

        if (isNaN(createdAt.getTime())) {
          console.warn(
            "Invalid creation timestamp for request:",
            req.id,
            "using current time"
          );
          createdAt.setTime(Date.now());
        }

        return {
          id: String(req.id),
          beneficiaryAddress: req.beneficiary,
          amount: Number(req.amount) / 1e6, // Convert from wei to USDT
          description: req.description || "No description provided",
          status: req.done 
            ? (req.paid ? "disbursed" : "rejected")
            : req.daoDecisionMade
              ? (req.daoApproved 
                  ? (req.donorVoteDeadline > 0 && Date.now() / 1000 > Number(req.donorVoteDeadline)
                      ? (Number(req.donorApproveCount) >= (Number(req.donorApproveCount) + Number(req.donorRejectCount)) * Number(req.quorumPercent) / 100
                          ? "waiting_claim" 
                          : "rejected")
                      : "donor_voting")
                  : "rejected")
              : "voting",
          createdAt: createdAt.toISOString(),
          approveCount: Number(req.approveCount) || 0,
          rejectCount: Number(req.rejectCount) || 0,
          proofHash: req.proofHash || "",
          // Additional fields for accurate status display
          daoDecisionMade: Boolean(req.daoDecisionMade),
          daoApproved: Boolean(req.daoApproved),
          paid: Boolean(req.paid),
          done: Boolean(req.done),
          quorumPercent: Number(req.quorumPercent) || 50,
          donorVoteDeadline: Number(req.donorVoteDeadline) || 0,
          donorApproveCount: Number(req.donorApproveCount) || 0,
          donorRejectCount: Number(req.donorRejectCount) || 0,
        };
      });

      console.log("Transformed requests:", transformedRequests);
      setRequests(transformedRequests);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const statusMatch =
      filterStatus === "all" || request.status === filterStatus;
    const searchMatch =
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.beneficiaryAddress
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const statusOptions = [
    { value: "all", label: "All Status", icon: <Filter className="h-4 w-4" />, color: "text-gray-600" },
    { value: "voting", label: "DAO Voting", icon: <Clock className="h-4 w-4" />, color: "text-yellow-600" },
    { value: "donor_voting", label: "Donor Voting", icon: <Clock className="h-4 w-4" />, color: "text-blue-600" },
    { value: "waiting_claim", label: "Waiting Claim", icon: <Clock className="h-4 w-4" />, color: "text-orange-600" },
    { value: "disbursed", label: "Disbursed", icon: <CheckCircle className="h-4 w-4" />, color: "text-green-600" },
    { value: "rejected", label: "Rejected", icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading request funds...</p>
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
              💰 Request Funds
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Request Fund Applications
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse and review request fund applications from community members
              seeking financial assistance.
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
                    placeholder="Search by description or address..."
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
                {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""} found
              </div>
            </div>
          </div>
        </motion.div>

        {/* Request List */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border border-border bg-card hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={getStatusColor(request.status)}
                      className="text-sm"
                    >
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{getStatusLabel(request.status)}</span>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      {formatUSDT(request.amount)}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 h-full flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    {/* Beneficiary */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Beneficiary:
                      </span>
                      <span className="font-mono text-xs">
                        {formatAddress(request.beneficiaryAddress)}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* DAO Voting Progress */}
                    {request.status === "voting" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">
                            Approve: {request.approveCount}
                          </span>
                          <span className="text-red-600">
                            Reject: {request.rejectCount}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className="bg-primary h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                request.approveCount + request.rejectCount > 0
                                  ? (request.approveCount /
                                      (request.approveCount +
                                        request.rejectCount)) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          Target: {request.quorumPercent}% approve votes to pass
                        </div>
                      </div>
                    )}

                    {/* Donor Voting Progress */}
                    {request.status === "donor_voting" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">
                            Approve: {request.donorApproveCount}
                          </span>
                          <span className="text-red-600">
                            Reject: {request.donorRejectCount}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                request.donorApproveCount + request.donorRejectCount > 0
                                  ? (request.donorApproveCount /
                                      (request.donorApproveCount +
                                        request.donorRejectCount)) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          Target: {request.quorumPercent}% approve votes to pass
                        </div>
                        {request.donorVoteDeadline > 0 && (
                          <div className="text-xs text-muted-foreground text-center">
                            Deadline: {new Date(request.donorVoteDeadline * 1000).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Waiting Claim Status */}
                    {request.status === "waiting_claim" && (
                      <div className="space-y-2">
                        <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="text-xs font-medium text-orange-800">
                            Approved by Donors
                          </div>
                          <div className="text-xs text-orange-600">
                            Waiting for beneficiary to claim funds
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Action Button */}
                  <Link
                    href={`/projects/requests/${request.id}`}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredRequests.length === 0 && !loading && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                No request funds found
              </h3>
              <p className="text-sm">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No request fund applications have been submitted yet."}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

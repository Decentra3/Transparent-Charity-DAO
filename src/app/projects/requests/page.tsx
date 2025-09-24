"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useOnchainStore } from "@/lib/store";
import { getAllRequests } from "@/lib/contract";
import { formatUSDT, formatAddress } from "@/lib/utils";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "disbursed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "rejected":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
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
    case "voting":
    default:
      return "secondary";
  }
};

export default function RequestFundsPage() {
  return <RequestFundsPageContent />;
}

function RequestFundsPageContent() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useOnchainStore();

  useEffect(() => {
    loadRequests();
  }, []);

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
      const transformedRequests = allRequests.map((req: any) => {
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
          status: req.done ? (req.paid ? "disbursed" : "rejected") : "voting",
          createdAt: createdAt.toISOString(),
          approveCount: Number(req.approveCount) || 0,
          rejectCount: Number(req.rejectCount) || 0,
          proofHash: req.proofHash || "",
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
    { value: "all", label: "All Status" },
    { value: "voting", label: "Voting" },
    { value: "disbursed", label: "Disbursed" },
    { value: "rejected", label: "Rejected" },
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
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  aria-label="Filter by status"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredRequests.length} request
              {filteredRequests.length !== 1 ? "s" : ""} found
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
                      <span className="ml-1 capitalize">{request.status}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      #{request.id}
                    </span>
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

                    {/* Voting Progress */}
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

'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { ArrowRight, Shield, Users, TrendingUp, Heart, Vote, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOnchainStore } from '@/lib/store';
import Link from 'next/link';
import { BASESCAN_BASE_URL, DONATION_DAO_ADDRESS } from '@/lib/contract';

export default function Home() {
  type Activity = {
    id: number | string;
    activityType: number;
    amountOrTarget?: number | string | null;
    title?: string | null;
    description?: string | null;
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const { isLoading, isLoaded, fundBalance, activities, refresh } = useOnchainStore();
  const totalProjects = activities.filter((a: Activity) => a.activityType === 1).length; // Projects = 1
  const activeRequests = activities.filter((a: Activity) => a.activityType === 0).length; // Requests = 0

  useEffect(() => {
    if (!isLoaded && !isLoading) refresh();
  }, [isLoaded, isLoading, refresh]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-[hsl(var(--background))] overflow-hidden">

        {/* Hero Content */}
        <motion.div
          className="relative z-0 container mx-auto px-4 sm:px-6 lg:px-8 text-center overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Badge className="mb-4 bg-transparent text-primary border-border">
              🌟 Blockchain-Powered Transparency
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight"
            variants={itemVariants}
          >
            Transparent Charity
            <br />
            <span className="text-5xl md:text-7xl lg:text-8xl">DAO</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Revolutionizing charitable giving through blockchain technology, 
            DAO governance, and AI-powered fraud detection for complete transparency.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            <Link href="/donate">
              <Button size="sm" className="group text-sm px-8 py-4">
                Donate Now
                <Heart className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              </Button>
            </Link>
            <Link href="/request">
              <Button variant="ghost" size="sm" className="group text-sm px-8 py-4 text-primary">
                Request Help
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <Card className="text-center h-full border border-border bg-card">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">100% Transparent</h3>
                  <p className="text-muted-foreground mt-2">Every transaction on blockchain with real-time tracking</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="text-center h-full border border-border bg-card">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Vote className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">DAO Governance</h3>
                  <p className="text-muted-foreground mt-2">Community-driven decisions through democratic voting</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="text-center h-full border border-border bg-card">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">AI Fraud Detection</h3>
                  <p className="text-muted-foreground mt-2">Advanced AI algorithms prevent fraudulent requests</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[hsl(var(--background))]">
        <motion.div
          className="container mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Impact by Numbers
            </h2>
            <p className="text-xl text-muted-foreground">
              Real-time statistics of our transparent charity ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border border-border bg-card">
                <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {isLoading && !isLoaded ? 'Loading...' : `$${fundBalance}`}
                </div>
                  <div className="text-muted-foreground font-medium">Total Fund</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border border-border bg-card">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">
                    $0.00
                  </div>
                  <div className="text-muted-foreground font-medium">Disbursed</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border border-border bg-card">
                <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {isLoading && !isLoaded ? '...' : totalProjects}
                </div>
                  <div className="text-muted-foreground font-medium">Projects Helped</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border border-border bg-card">
                <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {isLoading && !isLoaded ? '...' : activeRequests}
                </div>
                  <div className="text-muted-foreground font-medium">Active Requests</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Featured Projects Section (replaces Top DAO Members) */}
      <section className="py-20 bg-[hsl(var(--background))]">
        <motion.div
          className="container mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Projects
            </h2>
            <p className="text-xl text-muted-foreground">
              Explore on-chain charity projects on Base Sepolia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities
              .filter((a: Activity) => a.activityType === 1) // Only projects
              .slice(0, 3)
              .map((p: Activity, index: number) => (
              <motion.div
                key={String(p.id)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="relative overflow-hidden border border-border bg-card">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-transparent text-primary border-border">
                        #{String(p.id)}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{Number(p.amountOrTarget || 0) / 1e6} USDT</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{(p.title as string) || 'Untitled Project'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="line-clamp-3">{String(p.description || '')}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12 flex items-center justify-center gap-3">
            <Link href="/projects">
              <Button variant="ghost" size="lg" className="group text-primary">
                View All Projects
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`} target="_blank">
              <Button variant="ghost" size="lg" className="group text-primary">
                View on BaseScan
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-[hsl(var(--background))]">
        <motion.div
          className="container mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent process powered by blockchain and governed by the community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Submit Request",
                description: "Beneficiaries submit help requests with evidence and documentation",
                icon: Users
              },
              {
                step: 2,
                title: "DAO Voting",
                description: "DAO members review requests and vote on approval with AI assistance",
                icon: Vote
              },
              {
                step: 3,
                title: "Auto Disbursement",
                description: "Approved requests receive automatic on-chain disbursement with full transparency",
                icon: Shield
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="text-center h-full border border-border bg-card">
                  <CardContent className="pt-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <item.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="mb-4">
                      <Badge variant="outline" className="mb-3 text-primary border-border">Step {item.step}</Badge>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-20 mb-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Crowdfunding Flow</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Open a project, rally donors, and receive funds transparently when targets are met</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Create Project",
                description: "Proposers define title, goal in USDT, and clear impact description",
                icon: TrendingUp
              },
              {
                step: 2,
                title: "DAO Voting",
                description: "DAO members vote to approve the campaign before opening to public",
                icon: Vote
              },
              {
                step: 3,
                title: "Public Donation",
                description: "Once approved, everyone can donate USDT to support the campaign until target is met or deadline passes",
                icon: Users
              },
              {
                step: 4,
                title: "Disbursement",
                description: "Funds are transferred to the owner when the owner close the campaign",
                icon: Shield
              }
            ].map((item, index) => (
              <motion.div
                key={`cf-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="text-center h-full border border-border bg-card">
                  <CardContent className="pt-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <item.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="mb-4">
                      <Badge variant="outline" className="mb-3 text-primary border-border">Step {item.step}</Badge>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[hsl(var(--background))]">
        <motion.div
          className="container mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our transparent charity ecosystem today. Every donation matters, every vote counts, and every transaction is visible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/donate">
              <Button size="sm" className="text-sm px-8 py-4">
                Start Donating
                <Heart className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="text-sm px-8 py-4 text-primary">
                Explore Platform
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

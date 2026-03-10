"use client";

import Link from "next/link";
import { createPageUrl } from "@/utils";
import { 
  TrendingUp, 
  Mail, 
  Shield, 
  RefreshCw, 
  CreditCard, 
  HelpCircle,
  CheckCircle,
  BarChart3,
  Bell,
  Zap,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      {/* Hero Section */}
      <section className="text-center py-8">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30" />
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">About FindMyLine</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Your comprehensive sports betting odds comparison platform. Find the best lines across major US sportsbooks and prediction markets.
        </p>
      </section>

      {/* What We Offer */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          What We Offer
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Real-Time Odds Comparison</h3>
                <p className="text-slate-400 text-sm">Compare live odds from DraftKings, FanDuel, BetMGM, Caesars, ESPN BET, and more.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Prediction Markets</h3>
                <p className="text-slate-400 text-sm">Access odds from Polymarket, Kalshi, and other prediction market platforms.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Multiple Sports Coverage</h3>
                <p className="text-slate-400 text-sm">NFL, NBA, MLB, NHL, NCAAF, and NCAAB games covered daily.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Line Movement Tracking</h3>
                <p className="text-slate-400 text-sm">See how odds have moved over time to make informed decisions.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Live Scores & Updates</h3>
                <p className="text-slate-400 text-sm">Track games in progress with live scores and game status.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Injury Reports</h3>
                <p className="text-slate-400 text-sm">Stay informed with up-to-date player injury information.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Zap className="w-6 h-6 text-yellow-400" />
          How It Works
        </h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <h3 className="font-semibold text-white">Browse Games</h3>
              <p className="text-slate-400 text-sm">Select your sport and view all upcoming games with odds from multiple sportsbooks.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <h3 className="font-semibold text-white">Compare Odds</h3>
              <p className="text-slate-400 text-sm">Click on any game to see detailed odds comparison across spreads, moneylines, and totals.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div>
              <h3 className="font-semibold text-white">Find the Best Line</h3>
              <p className="text-slate-400 text-sm">Best odds are highlighted so you can quickly identify which sportsbook offers the most value.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">4</div>
            <div>
              <h3 className="font-semibold text-white">Place Your Bet</h3>
              <p className="text-slate-400 text-sm">Use direct links to place bets at your preferred sportsbook. We are an informational service only.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-green-400" />
          Subscription Plans
        </h2>
        <p className="text-slate-400 mb-6">
          FindMyLine offers both free and premium access. Free users can view odds from one sportsbook per game. Premium subscribers unlock full access to all sportsbooks and prediction markets.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-1">FindMy-Line Rookie</h3>
            <p className="text-2xl font-bold text-white mb-2">$5<span className="text-sm font-normal text-slate-400">/week</span></p>
            <p className="text-slate-400 text-sm">Perfect for trying out premium features.</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/50 relative">
            <span className="absolute -top-2 right-3 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Popular</span>
            <h3 className="font-semibold text-white mb-1">FindMy-Line Amateur</h3>
            <p className="text-2xl font-bold text-white mb-2">$15<span className="text-sm font-normal text-slate-400">/month</span></p>
            <p className="text-slate-400 text-sm">Best value for regular bettors.</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-1">FindMy-Line Pro</h3>
            <p className="text-2xl font-bold text-white mb-2">$120<span className="text-sm font-normal text-slate-400">/year</span></p>
            <p className="text-slate-400 text-sm">Save 33% with annual billing.</p>
          </div>
        </div>
        <div className="mt-6">
          <Link href={createPageUrl("Account")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              View Subscription Options
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Mail className="w-6 h-6 text-purple-400" />
          Contact Us
        </h2>
        <p className="text-slate-400 mb-4">
          Have questions, feedback, or need assistance? We&apos;re here to help.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-slate-300">
            <Mail className="w-5 h-5 text-slate-500" />
            <a href="mailto:support@findmyline.com" className="hover:text-blue-400 transition-colors">
              support@findmyline.com
            </a>
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-4">
          We typically respond within 24-48 business hours.
        </p>
      </section>

      {/* Refund & Cancellation Policy */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-orange-400" />
          Refund & Cancellation Policy
        </h2>
        <div className="space-y-4 text-slate-400">
          <div>
            <h3 className="font-semibold text-white mb-2">Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your Account page. Your access will continue until the end of your current billing period. No partial refunds are provided for unused time within a billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Refunds</h3>
            <p>
              Due to the digital nature of our service, we generally do not offer refunds for subscription payments. However, if you experience technical issues that prevent you from using the service, please contact us within 7 days of your payment and we will review your case.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Disputes</h3>
            <p>
              If you believe you were charged in error or have a billing dispute, please contact us at support@findmyline.com before initiating a chargeback with your bank. We are committed to resolving issues fairly and promptly.
            </p>
          </div>
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400" />
          Terms of Service
        </h2>
        <div className="space-y-4 text-slate-400 text-sm">
          <p>
            <strong className="text-white">Service Description:</strong> FindMyLine is an informational service that aggregates and displays sports betting odds from various sportsbooks and prediction markets. We do not accept bets, handle funds, or operate as a sportsbook.
          </p>
          <p>
            <strong className="text-white">Age Requirement:</strong> You must be at least 18 years old (or 21 in jurisdictions where required) to use this service. You are responsible for ensuring that sports betting is legal in your jurisdiction.
          </p>
          <p>
            <strong className="text-white">Accuracy of Information:</strong> While we strive to provide accurate and up-to-date odds information, we cannot guarantee the accuracy, completeness, or timeliness of the data displayed. Always verify odds directly with the sportsbook before placing any bets.
          </p>
          <p>
            <strong className="text-white">No Gambling Advice:</strong> FindMyLine does not provide gambling advice, recommendations, or tips. All betting decisions are made at your own risk. Please gamble responsibly.
          </p>
          <p>
            <strong className="text-white">Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your account and for all activities under your account. Accounts are for personal use only and may not be shared.
          </p>
          <p>
            <strong className="text-white">Service Modifications:</strong> We reserve the right to modify, suspend, or discontinue the service at any time without prior notice.
          </p>
          <p>
            <strong className="text-white">Limitation of Liability:</strong> FindMyLine shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of this service or any betting decisions made based on information provided.
          </p>
        </div>
      </section>

      {/* Legal Restrictions */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-red-400" />
          Legal Restrictions
        </h2>
        <div className="space-y-4 text-slate-400">
          <p>
            <strong className="text-white">Geographic Restrictions:</strong> Online sports betting is not legal in all US states or jurisdictions. FindMyLine is an informational service only. It is your responsibility to verify that sports betting is legal in your location before placing any bets with a sportsbook.
          </p>
          <p>
            <strong className="text-white">States Where Online Sports Betting is Legal:</strong> As of our last update, online sports betting is legal in: Arizona, Colorado, Connecticut, Delaware, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Nevada, New Hampshire, New Jersey, New York, North Carolina, Ohio, Oregon, Pennsylvania, Rhode Island, Tennessee, Vermont, Virginia, Washington D.C., West Virginia, and Wyoming.
          </p>
          <p>
            <strong className="text-white">Responsible Gambling:</strong> If you or someone you know has a gambling problem, please call the National Problem Gambling Helpline at 1-800-522-4700 or visit{" "}
            <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              ncpgambling.org
              <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Better Lines?</h2>
        <p className="text-slate-400 mb-6">Start comparing odds across top sportsbooks today.</p>
        <Link href={createPageUrl("Home")}>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Browse Today&apos;s Games
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </Link>
      </section>

      {/* Important Disclaimers */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Shield className="w-6 h-6 text-slate-400" />
          What We Are & What We&apos;re Not
        </h2>
        <div className="space-y-4 text-slate-400">
          <p>
            <strong className="text-white">FindMyLine is an analytics and information service.</strong> We provide odds comparison data to help you make informed decisions about where to place your bets.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="font-semibold text-white mb-3">We do NOT:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✕</span>
                <span>Accept deposits or pay out winnings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✕</span>
                <span>Place bets on behalf of users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✕</span>
                <span>Run paid contests, sweepstakes, or giveaways with prizes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✕</span>
                <span>Operate as a sportsbook or gambling service</span>
              </li>
            </ul>
          </div>
          <p className="text-sm">
            All actual betting is done directly through licensed sportsbooks. We simply help you find the best odds available.
          </p>
        </div>
      </section>

      {/* Business Info Footer */}
      <footer className="text-center text-sm text-slate-500 border-t border-slate-800/50 pt-8">
        <p className="font-semibold text-slate-400 mb-2">FindMyLine</p>
        <p>Sports Betting Odds Comparison & Analytics Service</p>
        <p className="mt-2">© {new Date().getFullYear()} FindMyLine. All rights reserved.</p>
      </footer>
    </div>
  );
}

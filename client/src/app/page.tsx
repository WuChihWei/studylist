'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Share2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-3xl pt-20 pb-32 sm:pt-48 sm:pb-40">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
            Collect, Plan, and Showcase Your Micro-Learning Journey
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              One click to turn scattered resources into tangible progress and connections.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-gray-900 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Key Features
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-start">
                <div className="rounded-md bg-white/50 p-2 ring-1 ring-gray-900/10">
                  <BookOpen className="h-6 w-6 text-gray-600" />
                </div>
                <dt className="mt-4 font-semibold text-gray-900">One-Click Collection</dt>
                <dd className="mt-2 leading-7 text-gray-600">
                  Gather articles, videos, and course links instantly under one topic.
                </dd>
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-md bg-white/50 p-2 ring-1 ring-gray-900/10">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <dt className="mt-4 font-semibold text-gray-900">Easy Path Planning</dt>
                <dd className="mt-2 leading-7 text-gray-600">
                  Create bite-sized steps for each goal and track completion.
                </dd>
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-md bg-white/50 p-2 ring-1 ring-gray-900/10">
                  <Share2 className="h-6 w-6 text-gray-600" />
                </div>
                <dt className="mt-4 font-semibold text-gray-900">Quick Progress Showcase</dt>
                <dd className="mt-2 leading-7 text-gray-600">
                  Generate a shareable report or link for resumes, LinkedIn, or friends.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="relative pl-9">
                <dt className="inline font-semibold text-gray-900">
                  <div className="absolute left-0 top-1 text-lg font-bold text-blue-600">1.</div>
                  Collect
                </dt>
                <dd className="mt-2 text-gray-600">Save any learning resource with a single click.</dd>
              </div>
              <div className="relative pl-9">
                <dt className="inline font-semibold text-gray-900">
                  <div className="absolute left-0 top-1 text-lg font-bold text-blue-600">2.</div>
                  Build
                </dt>
                <dd className="mt-2 text-gray-600">Arrange resources into short "learning segments" for a focused path.</dd>
              </div>
              <div className="relative pl-9">
                <dt className="inline font-semibold text-gray-900">
                  <div className="absolute left-0 top-1 text-lg font-bold text-blue-600">3.</div>
                  Showcase
                </dt>
                <dd className="mt-2 text-gray-600">Export a concise progress snapshot to share anywhere.</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start Building Your Micro Learning Visibility
            </h2>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

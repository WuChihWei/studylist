'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Youtube, BookOpen, Music2, BarChart2, Clock, Share2, Target, Zap, LineChart, Trophy } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const leftSectionRef = useRef(null);
  const rightSectionRef = useRef(null);

  useEffect(() => {
    // 初始化時設置元素在視窗外
    if (leftSectionRef.current) {
      (leftSectionRef.current as HTMLElement).style.transform = 'translateX(-100%)';
    }
    if (rightSectionRef.current) {
      (rightSectionRef.current as HTMLElement).style.transform = 'translateX(100%)';
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 進入視窗時，移動到原位
            (entry.target as HTMLElement).style.transform = 'translateX(0)';
          } else {
            // 離開視窗時，保持在原位
            if (entry.target.classList.contains('left-section')) {
              (entry.target as HTMLElement).style.transform = 'translateX(-100%)';
            } else if (entry.target.classList.contains('right-section')) {
              (entry.target as HTMLElement).style.transform = 'translateX(100%)';
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    if (leftSectionRef.current) {
      observer.observe(leftSectionRef.current);
    }
    if (rightSectionRef.current) {
      observer.observe(rightSectionRef.current);
    }

    return () => {
      if (leftSectionRef.current) {
        observer.unobserve(leftSectionRef.current);
      }
      if (rightSectionRef.current) {
        observer.unobserve(rightSectionRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative isolate px-8 pt-10">
        <div className="grid grid-cols-4 gap-4 min-h-[900px]">
          {/* Left Section */}
          <div 
            ref={leftSectionRef}
            className="relative h-full overflow-visible left-section transition-transform duration-1000"
          >
            <div className="absolute inset-1 -left-[10%] flex items-center">
              <div className="relative w-[2000px]">
                <Image
                  src="/interface-left.png"
                  alt="Interface Left"
                  width={2000}
                  height={2000}
                  className="w-full h-full object-contain"
                  priority
                  style={{ transform: 'scale(1.5)' }}
                />
              </div>
            </div>
          </div>

          {/* Center Sections Container */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] gap-2">
            {/* Center Top Section */}
            <div className="relative flex flex-col py-4">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold leading-[2] tracking-normal text-black md:text-4xl lg:text-6xl">
                  Instant Micro Learning Visibility for Job Seekers<br />
                  — With One Click
                  </h1>
                  <p className="mt-4 text-lg leading-8 text-gray-600">
                    Turn scattered study materials into a clear, visual growth path<br />
                    recruiters can instantly appreciate
                  </p>
                  <div className="mt-10 flex items-center justify-center">
                    <Link
                      href="/signup"
                      className="rounded-md bg-gray-900 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Start Your Learning Journey
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Bottom Section */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[600px] h-[400px]">
                  <Image
                    src="/interface-center.png"
                    alt="Interface Center"
                    width={600}
                    height={600}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div 
            ref={rightSectionRef}
            className="relative h-full overflow-visible right-section transition-transform duration-1000"
          >
            <div className="absolute inset-0 -right-[30%] flex items-center justify-end">
              <div className="relative w-[3000px]">
                <Image
                  src="/interface-right.png"
                  alt="Interface Right"
                  width={3000}
                  height={3000}
                  className="w-full h-full object-contain"
                  priority
                  style={{ transform: 'scale(1.5)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-black">Your Learning Journey</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Transform Your Self-Study Into Career Growth
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CheckCircle2 className="h-5 w-5 flex-none text-black" />
                  One-Click Collection
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Instantly import from YouTube, Google Books, Spotify, and more—no more endless link-juggling.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CheckCircle2 className="h-5 w-5 flex-none text-black" />
                  Micro-Learning Sessions
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Break big topics into bite-sized lessons. Progress in short bursts, perfect for tight schedules.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CheckCircle2 className="h-5 w-5 flex-none text-black" />
                  Visual Growth Path
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Dynamic charts highlight your daily and weekly achievements, perfect for sharing with recruiters.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Pain Points Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-black">Common Challenges</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Traditional Self-Study Falls Short
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col bg-gray-50 p-6 rounded-lg shadow-sm">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Share2 className="h-6 w-6 text-blue-600" />
                  </div>
                  Scattered Materials
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">YouTube videos, podcasts, e-books—scattered everywhere, hard to manage.</p>
                </dd>
              </div>
              <div className="flex flex-col bg-gray-50 p-6 rounded-lg shadow-sm">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  Hidden Effort
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Self-study rarely shows up strongly in résumés, even with countless hours spent learning.</p>
                </dd>
              </div>
              <div className="flex flex-col bg-gray-50 p-6 rounded-lg shadow-sm">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  Weak Motivation
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Without a clear progress overview, it's easy to lose momentum.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-black">Our Solution</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Streamlined Learning, Visible Progress
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Youtube className="h-6 w-6 text-white" />
                  </div>
                  Single-Click Integration
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Import and consolidate learning materials (YouTube, Google Books, Spotify, etc.) in seconds.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  Micro-Learning Sessions
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Short, focused modules let you progress steadily, perfect for busy schedules.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <BarChart2 className="h-6 w-6 text-white" />
                  </div>
                  Visual Growth Path
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Heatmaps, progress bars, or radar charts show your daily and weekly achievements at a glance.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  Easy Sharing for Recruiters
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Share a link or embed your growth data on LinkedIn or in your résumé, ensuring your dedication is clear.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-black">Benefits</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose Our Platform
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <LineChart className="h-5 w-5 flex-none text-blue-600" />
                  Efficiency
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Stop juggling links; gather all resources in one place.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Target className="h-5 w-5 flex-none text-blue-600" />
                  Clarity
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Track every small step with intuitive visuals.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Trophy className="h-5 w-5 flex-none text-blue-600" />
                  Career Boost
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Impress HR with real, data-driven proof of your learning journey.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="relative isolate overflow-hidden bg-blue-600 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Shine?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-100">
              Sign up now and let your micro-learning speak for itself—no more hidden effort.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started for free
              </Link>
              <Link
                href="/features"
                className="text-sm font-semibold leading-6 text-white"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

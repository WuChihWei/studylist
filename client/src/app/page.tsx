'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const leftSectionRef = useRef(null);
  const rightSectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            if (entry.target.classList.contains('left-section')) {
              (entry.target as HTMLElement).style.transform = 'translateX(-100%)';
            } else if (entry.target.classList.contains('right-section')) {
              (entry.target as HTMLElement).style.transform = 'translateX(100%)';
            }
          } else {
            (entry.target as HTMLElement).style.transform = 'translateX(0)';
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
      <div className="relative isolate px-8 pt-14 lg:px-2">
        <div className="grid grid-cols-4 gap-4 h-[900px]">
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
          <div className="col-span-2 grid grid-rows-2 gap-2 h-full">
            {/* Center Top Section */}
            <div className="relative flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold tracking-tight text-black sm:text-6xl">
                    Streamline, Learn, and<br />
                    Create a Virtual You<br />
                    with One Click
                  </h1>
                  <p className="mt-4 text-lg leading-8 text-gray-600">
                    Collect learning materials in one site, share and discuss<br />
                    with your students without burnout
                  </p>
                  <div className="mt-10 flex items-center justify-center">
                    <Link
                      href="/signup"
                      className="rounded-md bg-gray-900 px-8 py-4 mb-8 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Download Chrome Plugin
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Bottom Section */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[600px] h-[600px]">
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
            <h2 className="text-base font-semibold leading-7 text-black">Better Learning</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to master your studies
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CheckCircle2 className="h-5 w-5 flex-none text-black" />
                  Organized Learning
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Keep all your study materials in one place, organized by topics and categories.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CheckCircle2 className="h-5 w-5 flex-none text-black" />
                  Progress Tracking
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Monitor your learning progress with visual analytics and completion tracking.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CheckCircle2 className="h-5 w-5 flex-none text-black" />
                  Learning Paths
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Create custom learning paths and follow structured study plans.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start your learning journey today
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Join thousands of learners who are achieving their goals with StudyList.
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

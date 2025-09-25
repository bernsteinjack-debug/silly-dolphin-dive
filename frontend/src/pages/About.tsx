import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, BookOpen, Share2, Zap } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Catalog
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About Snap Your Shelf</h1>
            <p className="text-xl text-gray-600">
              Transform your physical movie collection into a digital catalog with AI-powered recognition
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Capture</h3>
              <p className="text-gray-600">Take a photo of your movie shelf and let AI detect individual spines</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto Recognition</h3>
              <p className="text-gray-600">Automatically identify movie titles and fetch detailed metadata</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Catalog</h3>
              <p className="text-gray-600">Browse your collection with rich details, ratings, and personal notes</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Sharing</h3>
              <p className="text-gray-600">Share your collection with friends or export your catalog</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 text-sm font-bold">1</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Capture Your Shelf</h3>
                  <p className="text-gray-600">Take a clear photo of your movie collection. Make sure the spines are visible and well-lit.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 text-sm font-bold">2</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Detection</h3>
                  <p className="text-gray-600">Our AI analyzes your photo to detect individual movie spines and extract titles using advanced OCR technology.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 text-sm font-bold">3</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Metadata Enrichment</h3>
                  <p className="text-gray-600">We automatically fetch detailed information including release year, director, cast, ratings, and more.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 text-sm font-bold">4</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Catalog</h3>
                  <p className="text-gray-600">Browse, search, and manage your digital collection. Add personal ratings and notes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Powered by AI</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Computer Vision</h3>
                <p className="text-gray-600 mb-4">
                  Advanced computer vision algorithms detect and isolate individual movie spines from your shelf photos.
                </p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Object detection and segmentation</li>
                  <li>• Perspective correction</li>
                  <li>• Edge detection and boundary analysis</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">OCR & NLP</h3>
                <p className="text-gray-600 mb-4">
                  Optical Character Recognition extracts text from spine images, enhanced with natural language processing.
                </p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Text extraction and recognition</li>
                  <li>• Title normalization and matching</li>
                  <li>• Metadata enrichment from databases</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
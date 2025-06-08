import React, { useState, useEffect } from 'react';
import { Menu, X, Calendar, Clock, TrendingUp, Users, Shield, Globe, ChevronRight, CalendarDays } from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPTO, setCurrentPTO] = useState(15);
  const [accrualRate, setAccrualRate] = useState(1.5); // days per month
  const [futureDate, setFutureDate] = useState('');
  const [futurePTO, setFuturePTO] = useState(0);

  useEffect(() => {
    // Calculate date 3 months from now
    const today = new Date();
    const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    setFutureDate(threeMonthsFromNow.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    
    // Calculate PTO in 3 months
    const additionalPTO = accrualRate * 3;
    setFuturePTO(currentPTO + additionalPTO);
  }, [currentPTO, accrualRate]);

  const features = [
    {
      icon: Calendar,
      title: "Smart Tracking",
      description: "Automatically track your PTO accrual and usage with intelligent calculations."
    },
    {
      icon: TrendingUp,
      title: "Future Planning",
      description: "See exactly how much PTO you'll have in the coming months to plan ahead."
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get instant updates on your PTO balance as you accrue and use time off."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your PTO data is encrypted and stored securely with enterprise-grade protection."
    }
  ];

  const stats = [
    { number: "50K+", label: "Happy Users" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" },
    { number: "100%", label: "Accurate" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">PTO Buddy</span>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <a href="#" className="text-gray-900 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    Home
                  </a>
                  <a href="#" className="text-gray-500 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    Dashboard
                  </a>
                  <a href="#" className="text-gray-500 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    Calendar
                  </a>
                  <a href="#" className="text-gray-500 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors">
                    Reports
                  </a>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  Sign In
                </button>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                  Get Started
                  <Calendar className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 p-2 rounded-md"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-100">
              <a href="#" className="text-gray-900 block px-3 py-2 text-base font-medium">Home</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium">Dashboard</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium">Calendar</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium">Reports</a>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-3 space-y-2">
                  <button className="w-full text-left text-gray-500 hover:text-gray-900 block px-0 py-2 text-base font-medium">
                    Sign In
                  </button>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors">
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with PTO Calculator */}
      <section className="relative bg-gradient-to-br from-emerald-50 to-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Never lose track of your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700 block">
                time off
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
              Plan your vacations with confidence. Track your PTO balance, 
              see future accruals, and never miss out on the time off you deserve.
            </p>
          </div>

          {/* PTO Calculator Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Your PTO Forecast
                </h2>
                <p className="text-gray-600">
                  See how much time off you'll have in the future
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current PTO Balance (days)
                    </label>
                    <input
                      type="number"
                      value={currentPTO}
                      onChange={(e) => setCurrentPTO(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Accrual Rate (days/month)
                    </label>
                    <input
                      type="number"
                      value={accrualRate}
                      onChange={(e) => setAccrualRate(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-sm text-emerald-700 font-medium mb-2">
                      On {futureDate}, you'll have:
                    </div>
                    <div className="text-4xl sm:text-5xl font-bold text-emerald-600 mb-2">
                      {futurePTO.toFixed(1)}
                    </div>
                    <div className="text-emerald-700 font-medium">
                      days of PTO
                    </div>
                    <div className="text-sm text-emerald-600 mt-3">
                      +{(accrualRate * 3).toFixed(1)} days from accrual
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center mx-auto">
                  Start Tracking My PTO
                  <Calendar className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600">{stat.number}</div>
                <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage PTO
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you track, plan, and optimize your time off.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Take control of your work-life balance
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Don't let unused PTO expire or miss out on well-deserved breaks. 
                PTO Buddy helps you stay on top of your time off so you can plan 
                the perfect vacation or mental health day.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Automatic accrual calculations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Smart vacation planning tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Expiration date reminders</span>
                </div>
              </div>
              <button className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center">
                Learn more about our features
                <ChevronRight className="ml-1 w-4 h-4" />
              </button>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-2xl">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-emerald-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-gray-900">Current Balance</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">15.5 days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{width: '62%'}}></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">62% of annual allowance</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-emerald-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-gray-900">Next Accrual</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">+1.5 days</span>
                  </div>
                  <div className="text-sm text-gray-600">January 1st, 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold">PTO Buddy</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Your trusted companion for managing time off. Never lose track of your 
                PTO balance and plan the perfect vacation with confidence.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Globe className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Users className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 PTO Buddy. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Check, Zap } from 'lucide-react';

export function Billing() {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      description: 'Perfect for personal use.',
      features: [
        'Ads Enabled',
        '1 Workspace',
        '1 Project',
        '1 GB Storage',
        '10 Tool Conversations/day'
      ],
      current: true,
    },
    {
      name: 'Pro',
      price: '₹499',
      period: '/month',
      description: 'Designed for professionals.',
      features: [
        'No Ads',
        '1 Workspace',
        '10 Projects',
        '10 GB Storage',
        'Up to 5 Team Members',
        'Project Analytics',
        '100 Tool Conversations/day'
      ],
      current: false,
      popular: true,
    },
    {
      name: 'Business',
      price: '₹2,950',
      period: '/month',
      description: 'For agencies and businesses.',
      features: [
        'No Ads',
        '5 Workspaces',
        '50 Projects',
        '100 GB Storage',
        'Up to 50 Team Members',
        'Advanced Analytics',
        'Priority Support',
        '800 Tool Conversations/day'
      ],
      current: false,
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Simple, transparent pricing</h1>
        <p className="text-slate-500 mt-4 text-lg">Choose the perfect plan for your digital workspace needs. Upgrade or downgrade at any time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? 'border-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-indigo-600' : ''}`}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
                {plan.price}
                {plan.period && <span className="ml-1 text-xl font-medium text-slate-500">{plan.period}</span>}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.popular ? 'primary' : (plan.current ? 'outline' : 'secondary')}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

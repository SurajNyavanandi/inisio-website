import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      'rounded-2xl border border-slate-200/90 bg-white transition-all duration-200 data-[state=open]:border-blue-500/80 data-[state=open]:shadow-[0_8px_30px_-12px_rgba(37,99,235,0.18)] hover:border-slate-300',
      className
    )}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'group flex flex-1 items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left font-manrope font-bold text-sm sm:text-base text-slate-900 transition-colors hover:text-blue-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset rounded-2xl [&[data-state=open]>span:last-child]:rotate-180 [&[data-state=open]>span:last-child]:bg-blue-600 [&[data-state=open]>span:last-child]:text-white [&[data-state=open]>span:last-child]:border-blue-600',
        className
      )}
      {...props}
    >
      <span className="leading-snug">{children}</span>
      <span className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-800 flex items-center justify-center shrink-0 transition-all duration-200">
        <ChevronDown className="w-4 h-4 shrink-0" />
      </span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm text-slate-600 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('px-5 pb-5 sm:px-6 sm:pb-6 pt-0', className)}>
      <div className="border-t border-slate-100 pt-4 leading-relaxed font-inter">
        {children}
      </div>
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

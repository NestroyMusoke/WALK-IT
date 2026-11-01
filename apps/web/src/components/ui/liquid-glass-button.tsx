"use client";

import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva,type VariantProps} from 'class-variance-authority';
import './liquid-glass-button.css';

/** The supplied liquid-glass treatment, with one semantic child for link use. */
export const liquidButtonVariants=cva('liquid-action',{
  variants:{
    variant:{default:'liquid-action--clear',primary:'liquid-action--amber',secondary:'liquid-action--clear'},
    size:{default:'liquid-action--default',sm:'liquid-action--sm',lg:'liquid-action--lg'},
  },
  defaultVariants:{variant:'default',size:'default'},
});

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof liquidButtonVariants>{asChild?:boolean}

export const LiquidButton=React.forwardRef<HTMLButtonElement,LiquidButtonProps>(
  ({asChild=false,variant,size,className='',type,children,...props},ref)=>{
    const Comp=asChild?Slot:'button';
    return <Comp data-slot="liquid-button" className={[liquidButtonVariants({variant,size}),className].filter(Boolean).join(' ')} ref={ref} {...(!asChild?{type:type??'button'}:{})} {...props}>{children}</Comp>;
  },
);
LiquidButton.displayName='LiquidButton';

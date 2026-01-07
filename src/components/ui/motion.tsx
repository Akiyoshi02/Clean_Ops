"use client";

import { motion, type Variants } from "framer-motion";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

// Animation variants for consistent motion across the app
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Micro-interaction variants
export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

// Motion components for easy reuse
export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionArticle = motion.article;
export const MotionUl = motion.ul;
export const MotionLi = motion.li;
export const MotionSpan = motion.span;

// Page transition wrapper
export const PageTransition = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof motion.div>
>(({ children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={fadeInUp}
    {...props}
  >
    {children}
  </motion.div>
));
PageTransition.displayName = "PageTransition";

// Stagger list wrapper
export const StaggerList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof motion.div>
>(({ children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial="hidden"
    animate="visible"
    variants={staggerContainer}
    {...props}
  >
    {children}
  </motion.div>
));
StaggerList.displayName = "StaggerList";

// Stagger list item
export const StaggerItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof motion.div>
>(({ children, ...props }, ref) => (
  <motion.div ref={ref} variants={staggerItem} {...props}>
    {children}
  </motion.div>
));
StaggerItem.displayName = "StaggerItem";

// Animated presence wrapper for conditional rendering
export { AnimatePresence } from "framer-motion";

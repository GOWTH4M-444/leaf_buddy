# Leaf Buddy

A friendly, interactive plant health field guide web app designed with a warm botanical paper aesthetic (`#F9F7F2` paper, `#FFFFFF` cards, `#3A6B52` sage green, `#C96A4B` terracotta) and child-friendly explanations for curious learners.

## Features

- **Built-In Sample Leaf Gallery**: Four pre-loaded garden leaf specimens (**Healthy Leaf**, **Leaf Spot / Early Blight**, **Powdery Mildew**, and **Yellow Leaf Rust**) ready to test immediately, plus an optional **Upload Your Own Leaf** photo picker.
- **CNN Analysis & Visual Stages**: Clicking **Check My Leaf** runs a gentle scanning sweep, reveals the diagnosis with a playful bounce-in result label, displays **Model Accuracy & Confidence** (**96.4%** overall test accuracy across 5,400 test photos alongside per-leaf class probabilities), and provides interactive Canvas filters for the 3 CNN stages (**1. Leaf Edges**, **2. Color Changes**, **3. Matching Patterns**).
- **Three Field-Guide Tabs**:
  - **Leaf Checker**: Sample leaf gallery, custom photo upload, scan & diagnosis workspace.
  - **How It Works**: Live interactive CNN stage filter explorer and per-class test accuracy breakdown.
  - **Plant Care Tips**: Filterable garden care handbook written in plain, everyday language.
- **Interactive Guided Tour**: Click **Take a Quick Tour** in the header for a 4-step spotlight walkthrough covering sample selection, navigation tabs, health results, and model accuracy.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite 8, Lucide React
- **Image & Feature Pipeline**: Client-side HTML5 Canvas pixel & Sobel edge extraction (`src/utils/cnnPipeline.ts`)
- **Typography**: Nunito (headings) & Plus Jakarta Sans (body)

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server on port 3000
npm run dev

# Build for production
npm run build

# Run TypeScript type checking
npm run lint

# Run unit tests for the CNN pixel pipeline
npx --yes tsx --test src/utils/cnnPipeline.test.ts
```

## Project Structure

```text
src/
├── assets/images/           # Generated botanical leaf specimen photos
├── components/
│   ├── GuidedTourOverlay.tsx
│   ├── HowItWorksView.tsx
│   ├── LeafCheckerView.tsx
│   ├── PlantCareTipsView.tsx
│   └── TopNav.tsx
├── data/
│   └── leaves.ts            # Sample leaves, accuracy benchmarks, care guides, tour steps
├── utils/
│   ├── cnnPipeline.ts       # Pixel feature extraction, classifier, and stage filters
│   └── cnnPipeline.test.ts  # Unit tests using node:test
├── App.tsx
├── index.css
└── main.tsx
```

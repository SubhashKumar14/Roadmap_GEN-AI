import React, { useState } from 'react';
import DSARoadmapView from './DSARoadmapView.jsx';

const RoadmapView = ({ roadmap, onTaskComplete, onBack }) => {
  // Check if this is an enhanced roadmap (has new format with detailed task structure)
  const isEnhancedRoadmap = roadmap.modules.some((module) =>
    module.tasks.some((task) =>
      task.difficulty || task.type || task.resources?.videos || task.learningObjectives
    )
  );

  // Always use enhanced DSA view for new format roadmaps
  if (isEnhancedRoadmap) {
    return (
      <DSARoadmapView
        roadmap={roadmap}
        onTaskComplete={onTaskComplete}
        onBack={onBack}
      />
    );
  }

  // Fallback to basic view for simple roadmaps
  return (
    <DSARoadmapView
      roadmap={roadmap}
      onTaskComplete={onTaskComplete}
      onBack={onBack}
    />
  );
};

export default RoadmapView;

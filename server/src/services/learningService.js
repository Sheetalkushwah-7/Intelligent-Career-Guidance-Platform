/**
 * learningService.js
 * Builds knowledge Graph and generates Stage-by-Stage learning roadmaps using Topological Sort.
 */

import { Graph } from '../algorithms/Graph.js';
import { TopologicalSort } from '../algorithms/TopologicalSort.js';
import { dataStore } from '../models/DataStore.js';

export class LearningService {
  /**
   * Build the complete directed prerequisite graph of all skills
   */
  static buildSkillGraph() {
    const graph = new Graph();
    const skills = dataStore.getAllSkills();

    for (const skill of skills) {
      graph.addNode(skill.id, skill);
    }

    for (const skill of skills) {
      for (const prereq of skill.prerequisites || []) {
        // Directed edge: prereq -> skill
        graph.addEdge(prereq, skill.id);
      }
    }

    return graph;
  }

  /**
   * Generate topological roadmap for a target career
   * @param {string} careerId 
   */
  static getLearningPathForCareer(careerId) {
    const career = dataStore.getCareer(careerId);
    if (!career) {
      throw new Error(`Career '${careerId}' not found`);
    }

    const student = dataStore.getStudent();
    const graph = this.buildSkillGraph();

    // Identify target skills where student is below threshold
    const targetSkillIds = [];
    const masteredSkillIds = new Set();

    for (const req of career.requiredSkills) {
      const current = student.skills[req.skillId] || 0;
      if (current < req.minProficiency) {
        targetSkillIds.push(req.skillId);
      } else {
        masteredSkillIds.add(req.skillId);
      }
    }

    // Run Topological Sort
    const { path, stages } = TopologicalSort.generateTargetedLearningPath(
      graph,
      targetSkillIds,
      masteredSkillIds
    );

    // Attach learning resources and estimated effort to each step
    const allResources = dataStore.getAllResources();
    const enrichedPath = path.map(step => {
      const skill = dataStore.getSkill(step.id);
      const req = career.requiredSkills.find(r => r.skillId === step.id);
      const targetProficiency = req ? req.minProficiency : 70;
      const currentProficiency = student.skills[step.id] || 0;
      const matchingResources = allResources.filter(r => r.skillId === step.id);

      return {
        stepId: step.id,
        skillName: skill ? skill.name : step.id,
        category: skill ? skill.category : 'General',
        stage: step.stage,
        currentProficiency,
        targetProficiency,
        gap: Math.max(0, targetProficiency - currentProficiency),
        resources: matchingResources,
        concepts: skill ? skill.concepts : []
      };
    });

    return {
      careerId: career.id,
      careerTitle: career.title,
      totalStages: stages.length,
      stages,
      roadmap: enrichedPath,
      estimatedTotalHours: enrichedPath.length * 8
    };
  }

  /**
   * Get raw Knowledge Graph data for interactive graph visualizer
   */
  static getGraphVisualizationData() {
    const skills = dataStore.getAllSkills();
    const careers = dataStore.getAllCareers();
    const student = dataStore.getStudent();

    const nodes = [];
    const links = [];

    // Skill nodes
    for (const skill of skills) {
      const current = student.skills[skill.id] || 0;
      nodes.push({
        id: skill.id,
        label: skill.name,
        type: 'SKILL',
        category: skill.category,
        proficiency: current,
        difficulty: skill.difficulty
      });

      // Prerequisite links (Skill -> Skill)
      for (const p of skill.prerequisites || []) {
        links.push({
          source: p,
          target: skill.id,
          type: 'PREREQUISITE'
        });
      }
    }

    // Career nodes & connections
    for (const career of careers) {
      nodes.push({
        id: `career_${career.id}`,
        label: career.title,
        type: 'CAREER',
        category: career.category,
        marketDemand: career.marketDemand
      });

      for (const req of career.requiredSkills) {
        links.push({
          source: req.skillId,
          target: `career_${career.id}`,
          type: 'REQUIRED_BY',
          weight: req.weight,
          minProficiency: req.minProficiency
        });
      }
    }

    return { nodes, links };
  }
}

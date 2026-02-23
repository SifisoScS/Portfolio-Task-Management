import type { ReflectionInput, ReflectionResponse, Critique, AdaptationSuggestion } from '@/types/reflection'

/**
 * LLM Prompt Template for Agentic Reflection
 * Johannesburg SME context with POPIA compliance
 */
export function buildReflectionPrompt(input: ReflectionInput): string {
  const { context, treeSnapshot } = input
  const { currentTime, timezone, loadSheddingStage, userLocation, recentActivity } = context

  const activityText = recentActivity
    .slice(-10)
    .map(a => `- [${a.timestamp}] ${a.action.toUpperCase()}: "${a.taskName}" (ID: ${a.taskId})`)
    .join('\n')

  const tasksJson = JSON.stringify(treeSnapshot.tasks, null, 2)

  return `You are an agentic supervisor for SME task management in ${userLocation}.

**Current Context:**
- Local time: ${currentTime} (${timezone})
- Load-shedding stage: ${loadSheddingStage}/8 (${getLoadSheddingImpact(loadSheddingStage)})
- Recent activity (last 10 actions):
${activityText}

**Task Tree Snapshot:**
- Total: ${treeSnapshot.totalTasks} tasks
- Completed: ${treeSnapshot.completedTasks} (${Math.round((treeSnapshot.completedTasks / treeSnapshot.totalTasks) * 100)}%)
- Overdue: ${treeSnapshot.overdueTasks}
- Blocked: ${treeSnapshot.blockedTasks}

**Tree Structure:**
\`\`\`json
${tasksJson}
\`\`\`

**Your Mission:**
Reflect on recent execution and provide actionable critique and adaptations.

**Analysis Framework:**

1. **Critique Outcomes:**
   - Identify blockers (incomplete dependencies, resource constraints, load-shedding risks)
   - Detect inefficiencies (poor ordering, circular dependencies, estimation errors)
   - Spot opportunities (quick wins, high-impact tasks, automation potential)
   - Check compliance (POPIA data handling, VAT deadlines, CIPC returns, SARS submissions)

2. **Propagate Effects (Mathematical):**
   - Calculate parent task progress: weighted average of subtask completion %
   - Formula: \`parentProgress = Σ(subtask.weight * subtask.progress) / Σ(subtask.weight)\`
   - Default weight = 1 for all subtasks
   - Bubble up progress to all ancestors recursively

3. **Suggest Adaptations:**
   - Reorder siblings by urgency: \`score = 0.6*overduePenalty + 0.3*dependencySat + 0.1*effortInverse\`
   - Reschedule tasks conflicting with load-shedding windows (Stage 4+ = avoid 2-hour blocks)
   - Split large tasks (>5 subtasks) into manageable chunks
   - Flag tasks with POPIA-sensitive data (names, IDs, financials) for anonymization

4. **POPIA Compliance:**
   - Anonymize personal identifiers in output (replace with "User A", "Client B")
   - Flag tasks containing "invoice", "payroll", "client details" for data protection review
   - Recommend encryption for tasks tagged with "financial" or "compliance"

**Output Format (JSON):**
\`\`\`json
{
  "critique": {
    "summary": "2-3 sentence overview",
    "blockers": [
      {
        "taskId": 123,
        "taskName": "Task name",
        "issue": "Description",
        "severity": "high|medium|low",
        "suggestedAction": "Concrete next step"
      }
    ],
    "inefficiencies": [
      {
        "category": "dependency|ordering|estimation|resource",
        "description": "What's inefficient",
        "affectedTasks": [123, 456],
        "potentialTimeSavings": "2 hours"
      }
    ],
    "opportunities": [
      {
        "type": "quick-win|high-impact|automation|delegation",
        "description": "Opportunity description",
        "tasks": [123],
        "estimatedBenefit": "Save 30min daily"
      }
    ],
    "complianceIssues": [
      {
        "regulation": "POPIA|VAT|CIPC|SARS",
        "severity": "critical|warning",
        "description": "Issue details",
        "deadline": "2026-02-28",
        "remediation": "Action to take"
      }
    ]
  },
  "progressPropagations": [
    {
      "taskId": 100,
      "taskName": "Parent task",
      "oldProgress": 0.5,
      "newProgress": 0.75,
      "calculationMethod": "weighted-average",
      "affectedAncestors": [50, 10]
    }
  ],
  "adaptations": [
    {
      "taskId": 123,
      "taskName": "Task name",
      "adaptationType": "reorder|reschedule|reassign|split|merge",
      "newOrderIndex": 1,
      "newParentId": 456,
      "newDueDate": "2026-02-25T14:00:00+02:00",
      "rationale": "Why this change",
      "urgencyScore": 0.85,
      "confidenceScore": 0.9
    }
  ],
  "reasoning": "**Markdown chain-of-thought:**\\n\\n1. Analysis of blockers...\\n2. Progress calculations...\\n3. Adaptation logic..."
}
\`\`\`

**Constraints:**
- Max 10 adaptations per reflection
- Only suggest reordering within same parent (preserve hierarchy)
- Respect completed tasks (don't suggest changes to done items)
- Load-shedding aware: avoid scheduling complex tasks during Stage 4+ windows

Analyze and respond with JSON only (no additional text).`
}

function getLoadSheddingImpact(stage: number): string {
  if (stage === 0) return 'No load-shedding'
  if (stage <= 2) return 'Minimal disruption'
  if (stage <= 4) return 'Moderate disruption (plan around outages)'
  if (stage <= 6) return 'Severe disruption (critical work only during power)'
  return 'Extreme disruption (expect 8+ hours daily outage)'
}

/**
 * Mock Reflection Implementation
 * Uses heuristics for offline/fallback scenarios
 */
export function mockReflection(input: ReflectionInput): ReflectionResponse {
  const startTime = performance.now()
  const { treeSnapshot, context } = input

  // Analyze blockers
  const blockers = treeSnapshot.tasks
    .filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date())
    .slice(0, 5)
    .map(t => ({
      taskId: t.id,
      taskName: t.name,
      issue: 'Task is overdue',
      severity: 'high' as const,
      suggestedAction: 'Review and reschedule or complete immediately'
    }))

  // Detect inefficiencies
  const inefficiencies = []
  const tasksWithManySubtasks = treeSnapshot.tasks.filter(
    t => treeSnapshot.tasks.filter(child => child.parentId === t.id).length > 7
  )
  if (tasksWithManySubtasks.length > 0) {
    inefficiencies.push({
      category: 'ordering' as const,
      description: 'Tasks with >7 subtasks may be hard to manage',
      affectedTasks: tasksWithManySubtasks.map(t => t.id),
      potentialTimeSavings: '30 minutes per task'
    })
  }

  // Find opportunities
  const opportunities = []
  const quickWins = treeSnapshot.tasks.filter(
    t => !t.isCompleted && !t.dueDate && (!t.tags || t.tags.length === 0)
  ).slice(0, 3)
  if (quickWins.length > 0) {
    opportunities.push({
      type: 'quick-win' as const,
      description: 'Tasks without due dates or tags can be completed quickly',
      tasks: quickWins.map(t => t.id),
      estimatedBenefit: 'Clear small tasks to reduce mental load'
    })
  }

  // Check compliance (simple heuristic)
  const complianceIssues = []
  const vatKeywords = ['vat', 'tax', 'sars', 'invoice']
  const popiaKeywords = ['client', 'personal', 'id number', 'payroll']

  treeSnapshot.tasks.forEach(t => {
    const lowerName = t.name.toLowerCase()
    if (vatKeywords.some(kw => lowerName.includes(kw))) {
      complianceIssues.push({
        regulation: 'VAT' as const,
        severity: 'warning' as const,
        description: `Task "${t.name}" may involve VAT compliance`,
        remediation: 'Ensure VAT returns are filed by month-end'
      })
    }
    if (popiaKeywords.some(kw => lowerName.includes(kw))) {
      complianceIssues.push({
        regulation: 'POPIA' as const,
        severity: 'warning' as const,
        description: `Task "${t.name}" may contain personal information`,
        remediation: 'Review data handling practices for POPIA compliance'
      })
    }
  })

  // Calculate progress propagations (simplified)
  const progressPropagations = treeSnapshot.tasks
    .filter(t => treeSnapshot.tasks.some(child => child.parentId === t.id))
    .map(parent => {
      const children = treeSnapshot.tasks.filter(child => child.parentId === parent.id)
      const completedChildren = children.filter(c => c.isCompleted).length
      const newProgress = children.length > 0 ? completedChildren / children.length : 0
      return {
        taskId: parent.id,
        taskName: parent.name,
        oldProgress: 0,
        newProgress: Math.round(newProgress * 100) / 100,
        calculationMethod: 'simple-average' as const,
        affectedAncestors: []
      }
    })
    .filter(p => p.newProgress > 0)
    .slice(0, 10)

  // Generate adaptations (reorder by urgency)
  const adaptations: AdaptationSuggestion[] = []

  // Prioritize overdue tasks
  const overdueTasks = treeSnapshot.tasks
    .filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date())
    .sort((a, b) => {
      const dateA = new Date(a.dueDate!).getTime()
      const dateB = new Date(b.dueDate!).getTime()
      return dateA - dateB
    })
    .slice(0, 5)

  overdueTasks.forEach((task, index) => {
    adaptations.push({
      taskId: task.id,
      taskName: task.name,
      adaptationType: 'reorder',
      newOrderIndex: index,
      newParentId: task.parentId || null,
      rationale: `Overdue by ${Math.ceil((Date.now() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24))} days - needs immediate attention`,
      urgencyScore: 0.95,
      confidenceScore: 0.9
    })
  })

  // Load-shedding adaptations
  if (context.loadSheddingStage >= 4) {
    const tasksNeedingPower = treeSnapshot.tasks
      .filter(t => !t.isCompleted && t.tags?.some(tag =>
        ['computer', 'online', 'meeting', 'video'].includes(tag.toLowerCase())
      ))
      .slice(0, 3)

    tasksNeedingPower.forEach(task => {
      adaptations.push({
        taskId: task.id,
        taskName: task.name,
        adaptationType: 'reschedule',
        rationale: `Load-shedding Stage ${context.loadSheddingStage} - reschedule power-dependent tasks`,
        urgencyScore: 0.7,
        confidenceScore: 0.85
      })
    })
  }

  const critique: Critique = {
    summary: `Analyzed ${treeSnapshot.totalTasks} tasks: ${blockers.length} blockers, ${inefficiencies.length} inefficiencies, ${opportunities.length} opportunities identified. Load-shedding: Stage ${context.loadSheddingStage}.`,
    blockers,
    inefficiencies,
    opportunities,
    complianceIssues: complianceIssues.slice(0, 5)
  }

  const reasoning = `## Reflection Analysis

### 1. Blocker Detection
- Found ${blockers.length} overdue tasks requiring immediate attention
- ${treeSnapshot.blockedTasks} tasks blocked by dependencies

### 2. Progress Propagation
- Calculated completion % for ${progressPropagations.length} parent tasks
- Method: Simple average of subtask completion

### 3. Adaptation Strategy
- Generated ${adaptations.length} suggestions
- Priority: Overdue tasks first (urgency score 0.95)
${context.loadSheddingStage >= 4 ? '- **Load-shedding impact**: Reschedule power-dependent tasks' : ''}

### 4. Compliance Check
- ${complianceIssues.length} potential compliance issues flagged
- Focus: POPIA data protection + VAT deadlines

### 5. Opportunities
${opportunities.map(o => `- **${o.type}**: ${o.description}`).join('\n')}

**Recommendation**: Apply adaptations to reorder ${adaptations.length} tasks for better workflow.`

  return {
    critique,
    progressPropagations,
    adaptations,
    reasoning,
    metadata: {
      processingTimeMs: Math.round(performance.now() - startTime),
      modelUsed: 'mock-heuristic-v1',
      timestamp: new Date().toISOString()
    }
  }
}

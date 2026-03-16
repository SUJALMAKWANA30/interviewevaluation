import React from 'react';
// import { cn } from '../../utils/cn';

const statusStyles = {
  'not-started': {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    inline: { background: '#f3f4f6', color: '#374151' }
  },
  'in-progress': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    inline: { background: '#dbeafe', color: '#1e40af' }
  },
  'completed': {
    bg: 'bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
    inline: { background: '#d1fae5', color: '#065f46' }
  },
  'present': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    inline: { background: '#d1fae5', color: '#047857' }
  },
  'absent': {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
    inline: { background: '#fee2e2', color: '#991b1b' }
  },
};

const statusLabels = {
  'not-started': 'Absent',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'present': 'Present',
  'absent': 'Absent',
};

export function StatusBadge({ status, isAttendance = false }) {
  let normalizedStatus = status?.toLowerCase()?.replace(' ', '-') || 'not-started';
  
  // For attendance column, convert not-started to absent
  if (isAttendance && normalizedStatus === 'not-started') {
    normalizedStatus = 'absent';
  }
  
  const style = statusStyles[normalizedStatus] || statusStyles['absent'];
  const label = statusLabels[normalizedStatus] || status || 'Absent';
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        ...style.inline
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: normalizedStatus === 'not-started' ? '#ef4444' 
            : normalizedStatus === 'in-progress' ? '#3b82f6'
            : normalizedStatus === 'completed' ? '#22c55e'
            : normalizedStatus === 'present' ? '#10b981'
            : normalizedStatus === 'absent' ? '#ef4444' : '#ef4444'
        }}
      />
      {label}
    </span>
  );
}

// Round Stepper Component for Status Column
// Accepts optional `driveRounds` prop: array of { name, type, order }
// Falls back to hardcoded R1-R4 if not provided (backward-compatible)
export function RoundStepper({ candidate, driveRounds }) {
  const [hoveredStep, setHoveredStep] = React.useState(null);

  // Default rounds if none provided by drive
  const defaultRounds = [
    { name: "R1", type: "Exam", order: 1 },
    { name: "R2", type: "Interview", order: 2 },
    { name: "R3", type: "Interview", order: 3 },
    { name: "R4", type: "Interview", order: 4 },
  ];

  const activeRounds = (driveRounds && driveRounds.length > 0)
    ? [...driveRounds].sort((a, b) => a.order - b.order)
    : defaultRounds;

  // Helper to extract round data from candidate for any round name
  const getRoundData = (roundName) => {
    const upperName = roundName.toUpperCase();

    // R1 is special — comes from Final Score / MCQ
    if (upperName === "R1") {
      const score = candidate.quiz?.["Final Score"] || candidate.score || null;
      const scoreNum = score !== null ? parseInt(score) : null;
      const isDropped = scoreNum !== null && scoreNum < 13;
      const isPassed = scoreNum !== null && scoreNum >= 13;
      return {
        data: score,
        roundStatus: isDropped ? "drop" : isPassed ? "completed" : "",
        interviewer: null,
        isDropped,
        isRejected: false,
        managerialStatus: null,
      };
    }

    // For any other round (R2, R3, R4, R5, etc.) — data lives in candidate.quiz[roundName]
    const quizData = candidate.quiz?.[upperName] || candidate.quiz?.[roundName];
    const entry = Array.isArray(quizData) && quizData[0] ? quizData[0] : (quizData && typeof quizData === "object" ? quizData : null);

    if (!entry) {
      return { data: null, roundStatus: "", interviewer: null, isDropped: false, isRejected: false, managerialStatus: null };
    }

    const status = normalizeStatus(entry.status);
    const interviewer = entry.interviewer || null;

    // R3 has special managerial status field
    const managerialRating = entry.managerialStatus || entry["Managerial status"] || entry["managerial status"] || null;
    const rating = managerialRating || entry.rating || null;

    return {
      data: rating,
      roundStatus: status,
      interviewer,
      isDropped: status === "drop",
      isRejected: status === "rejected",
      managerialStatus: managerialRating ? managerialRating.toUpperCase() : null,
    };
  };

  // Normalize status for comparison
  const normalizeStatus = (status) => {
    if (!status) return '';
    const s = status.toLowerCase().trim();
    if (s === 'drop' || s === 'dropped') return 'drop';
    if (s === 'rejected' || s === 'reject') return 'rejected';
    if (s === 'in progress' || s === 'in-progress' || s === 'inprogress') return 'in progress';
    if (s === 'completed' || s === 'complete') return 'completed';
    return s;
  };

  // Build steps from active rounds
  const steps = activeRounds.map((round) => {
    const rd = getRoundData(round.name);
    const upperName = round.name.toUpperCase();

    // Determine label: R3 shows G/H for GO/HOLD, others show round name
    let label = round.name;
    if (rd.managerialStatus === "GO") label = "G";
    else if (rd.managerialStatus === "HOLD") label = "H";

    return {
      id: upperName,
      label,
      type: round.type,
      ...rd,
    };
  });
  
  const getTooltipContent = (step) => {
    let lines = [];
    
    if (step.type === 'Exam' || step.id === 'R1') {
      if (step.data) {
        lines.push(`Score: ${step.data}/30`);
        if (step.isDropped) {
          lines.push('Status: DROPPED (Score < 13)');
        } else {
          lines.push('Status: PASSED');
        }
      } else {
        lines.push('Not attempted');
      }
    } else if (step.managerialStatus) {
      if (step.data) lines.push(`Decision: ${step.data}`);
      if (step.interviewer) lines.push(`Interviewer: ${step.interviewer}`);
      if (step.roundStatus) {
        const displayStatus = step.roundStatus.charAt(0).toUpperCase() + step.roundStatus.slice(1);
        lines.push(`Round Status: ${displayStatus}`);
      }
      if (lines.length === 0) lines.push('Pending');
    } else {
      if (step.data) lines.push(`Rating: ${step.data}/10`);
      if (step.interviewer) lines.push(`Interviewer: ${step.interviewer}`);
      if (step.roundStatus) lines.push(`Status: ${step.roundStatus}`);
      if (lines.length === 0) lines.push('Not started');
    }
    
    return lines;
  };
  
  // Color logic based ONLY on status field from database
  const getStepColor = (step) => {
    const status = step.roundStatus;
    
    // Priority 0: R3 special case - GO = Green, HOLD = Yellow
    if (step.id === 'R3' && step.managerialStatus) {
      if (step.managerialStatus === 'GO') {
        return { bg: '#d1fae5', border: '#059669', text: '#059669' }; // Green
      }
      if (step.managerialStatus === 'HOLD') {
        return { bg: '#fef3c7', border: '#d97706', text: '#d97706' }; // Yellow
      }
    }
    
    // Priority 1: Drop status = RED with dark red border
    if (status === 'drop' || step.isDropped) {
      return { bg: '#fee2e2', border: '#dc2626', text: '#dc2626' };
    }
    
    // Priority 2: Rejected status = RED with dark red border (same as drop)
    if (status === 'rejected' || step.isRejected) {
      return { bg: '#fee2e2', border: '#dc2626', text: '#dc2626' };
    }
    
    // Priority 3: Completed status = GREEN with dark green border
    if (status === 'completed') {
      return { bg: '#d1fae5', border: '#059669', text: '#059669' };
    }
    
    // Priority 4: In Progress status = LIGHT BLUE with dark blue border
    if (status === 'in progress') {
      return { bg: '#dbeafe', border: '#2563eb', text: '#2563eb' };
    }
    
    // Priority 5: Empty/No status = GREY
    return { bg: '#f3f4f6', border: '#9ca3af', text: '#9ca3af' };
  };
  
  // Get line color based on the CURRENT step's status (not next step)
  const getLineColor = (currentStep, nextStep) => {
    const currentStatus = currentStep.roundStatus;
    
    // If current step is dropped or rejected, line is dark red
    if (currentStatus === 'drop' || currentStep.isDropped || currentStatus === 'rejected' || currentStep.isRejected) {
      return '#dc2626';
    }
    
    // If current step is completed, line is dark green
    if (currentStatus === 'completed') {
      return '#059669';
    }
    
    // If current step is in progress, line is dark blue
    if (currentStatus === 'in progress') {
      return '#2563eb';
    }
    
    // Default grey
    return '#9ca3af';
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
      {steps.map((step, index) => {
        const colors = getStepColor(step);
        const tooltipLines = getTooltipContent(step);
        return (
          <React.Fragment key={step.id}>
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: colors.bg,
                  border: `2px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: colors.text,
                  cursor: 'default',
                  transition: 'all 0.2s ease',
                }}
              >
                {step.isDropped ? '✗' : step.label}
              </div>
              
              {/* Tooltip */}
              {hoveredStep === step.id && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    padding: '8px 12px',
                    background: step.isDropped ? '#dc2626' : '#1f2937',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    zIndex: 50,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: tooltipLines.length > 1 ? '4px' : 0 }}>
                    {step.id} {step.isDropped && '- DROPPED'}
                  </div>
                  {tooltipLines.map((line, i) => (
                    <div key={i} style={{ opacity: 0.9 }}>{line}</div>
                  ))}
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: `6px solid ${step.isDropped ? '#dc2626' : '#1f2937'}`,
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Connector line between steps - based on current step status */}
            {index < steps.length - 1 && (
              <div
                style={{
                  width: '12px',
                  height: '2px',
                  background: getLineColor(steps[index], steps[index + 1]),
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

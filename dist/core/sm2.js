/**
 * State-aware spaced repetition algorithm based on SM-2.
 *
 * Learning steps schedule (in minutes): [1, 10]
 * Cards progress through: new → learning → review
 * Failed review cards go: review → relearning → review
 */
export const LEARNING_STEPS = [1, 10]; // minutes
/**
 * Returns the interval label for a given rating without applying it.
 * Used to show hints on rating buttons like "[3] Good · 10m".
 */
export function getIntervalHint(input) {
    const hints = { 1: '', 2: '', 3: '', 4: '' };
    for (const r of [1, 2, 3, 4]) {
        const result = sm2({ ...input, rating: r });
        if (result.state === 'learning' || result.state === 'relearning') {
            // Interval is in minutes
            const step = LEARNING_STEPS[result.learningStep] ?? LEARNING_STEPS[LEARNING_STEPS.length - 1];
            hints[r] = `${step}m`;
        }
        else {
            // Interval is in days
            if (result.interval === 1)
                hints[r] = '1d';
            else
                hints[r] = `${result.interval}d`;
        }
    }
    return hints;
}
export function sm2(input) {
    const { rating, state, learningStep, repetitions, easeFactor, interval } = input;
    switch (state) {
        case 'new':
            return handleNew(rating, easeFactor);
        case 'learning':
            return handleLearning(rating, learningStep, easeFactor);
        case 'review':
            return handleReview(rating, repetitions, easeFactor, interval);
        case 'relearning':
            return handleRelearning(rating, learningStep, repetitions, easeFactor, interval);
    }
}
function handleNew(rating, easeFactor) {
    switch (rating) {
        case 1: // Again → learning step 0
            return {
                state: 'learning',
                learningStep: 0,
                repetitions: 0,
                easeFactor: adjustEase(easeFactor, rating),
                interval: 0,
                dueDate: minutesFromNow(LEARNING_STEPS[0]),
                graduated: false,
            };
        case 2: // Hard → learning step 0
            return {
                state: 'learning',
                learningStep: 0,
                repetitions: 0,
                easeFactor: adjustEase(easeFactor, rating),
                interval: 0,
                dueDate: minutesFromNow(LEARNING_STEPS[0]),
                graduated: false,
            };
        case 3: // Good → learning step 1
            return {
                state: 'learning',
                learningStep: 1,
                repetitions: 0,
                easeFactor: adjustEase(easeFactor, rating),
                interval: 0,
                dueDate: minutesFromNow(LEARNING_STEPS[1] ?? LEARNING_STEPS[0]),
                graduated: false,
            };
        case 4: // Easy → graduate immediately
            return graduate(0, adjustEase(easeFactor, rating));
    }
}
function handleLearning(rating, step, easeFactor) {
    const ef = adjustEase(easeFactor, rating);
    switch (rating) {
        case 1: // Again → reset to step 0
            return {
                state: 'learning',
                learningStep: 0,
                repetitions: 0,
                easeFactor: ef,
                interval: 0,
                dueDate: minutesFromNow(LEARNING_STEPS[0]),
                graduated: false,
            };
        case 2: // Hard → stay at same step
            return {
                state: 'learning',
                learningStep: step,
                repetitions: 0,
                easeFactor: ef,
                interval: 0,
                dueDate: minutesFromNow(LEARNING_STEPS[step] ?? LEARNING_STEPS[LEARNING_STEPS.length - 1]),
                graduated: false,
            };
        case 3: { // Good → advance step; if past last step → graduate
            const nextStep = step + 1;
            if (nextStep >= LEARNING_STEPS.length) {
                return graduate(0, ef);
            }
            return {
                state: 'learning',
                learningStep: nextStep,
                repetitions: 0,
                easeFactor: ef,
                interval: 0,
                dueDate: minutesFromNow(LEARNING_STEPS[nextStep]),
                graduated: false,
            };
        }
        case 4: // Easy → graduate immediately
            return graduate(0, ef);
    }
}
function handleReview(rating, repetitions, easeFactor, interval) {
    const ef = adjustEase(easeFactor, rating);
    if (rating === 1) {
        // Again → relearning
        return {
            state: 'relearning',
            learningStep: 0,
            repetitions: 0,
            easeFactor: ef,
            interval: interval, // preserve the old interval for re-graduation
            dueDate: minutesFromNow(LEARNING_STEPS[0]),
            graduated: false,
        };
    }
    // Hard / Good / Easy → stay in review with SM-2 intervals
    let newInterval;
    if (repetitions === 0) {
        newInterval = 1;
    }
    else if (repetitions === 1) {
        newInterval = 6;
    }
    else {
        newInterval = Math.round(interval * ef);
    }
    // Hard gets a shorter interval, Easy gets a bonus
    if (rating === 2)
        newInterval = Math.max(1, Math.round(newInterval * 0.8));
    if (rating === 4)
        newInterval = Math.max(1, Math.round(newInterval * 1.3));
    return {
        state: 'review',
        learningStep: 0,
        repetitions: repetitions + 1,
        easeFactor: ef,
        interval: newInterval,
        dueDate: daysFromNow(newInterval),
        graduated: true, // stays in review = exits the session
    };
}
function handleRelearning(rating, step, repetitions, easeFactor, interval) {
    const ef = adjustEase(easeFactor, rating);
    switch (rating) {
        case 1: // Again → reset to step 0
            return {
                state: 'relearning',
                learningStep: 0,
                repetitions: 0,
                easeFactor: ef,
                interval: interval,
                dueDate: minutesFromNow(LEARNING_STEPS[0]),
                graduated: false,
            };
        case 2: // Hard → stay at same step
            return {
                state: 'relearning',
                learningStep: step,
                repetitions: 0,
                easeFactor: ef,
                interval: interval,
                dueDate: minutesFromNow(LEARNING_STEPS[step] ?? LEARNING_STEPS[LEARNING_STEPS.length - 1]),
                graduated: false,
            };
        case 3: { // Good → advance step; if past last → re-graduate
            const nextStep = step + 1;
            if (nextStep >= LEARNING_STEPS.length) {
                // Re-graduate: use a fraction of the old interval
                const newInterval = Math.max(1, Math.round(interval * 0.7));
                return {
                    state: 'review',
                    learningStep: 0,
                    repetitions: 1,
                    easeFactor: ef,
                    interval: newInterval,
                    dueDate: daysFromNow(newInterval),
                    graduated: true,
                };
            }
            return {
                state: 'relearning',
                learningStep: nextStep,
                repetitions: 0,
                easeFactor: ef,
                interval: interval,
                dueDate: minutesFromNow(LEARNING_STEPS[nextStep]),
                graduated: false,
            };
        }
        case 4: { // Easy → re-graduate immediately
            const newInterval = Math.max(1, Math.round(interval * 0.7));
            return {
                state: 'review',
                learningStep: 0,
                repetitions: 1,
                easeFactor: ef,
                interval: newInterval,
                dueDate: daysFromNow(newInterval),
                graduated: true,
            };
        }
    }
}
// ── Helpers ──────────────────────────────────────────────────────────
function graduate(reps, easeFactor) {
    return {
        state: 'review',
        learningStep: 0,
        repetitions: reps + 1,
        easeFactor,
        interval: 1,
        dueDate: daysFromNow(1),
        graduated: true,
    };
}
function adjustEase(ease, rating) {
    const q = (rating - 1) * (5 / 3);
    let ef = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef < 1.3)
        ef = 1.3;
    return Math.round(ef * 1000) / 1000;
}
function minutesFromNow(minutes) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
}
function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

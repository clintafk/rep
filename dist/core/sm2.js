export function sm2(input) {
    const { rating, repetitions, easeFactor, interval } = input;
    let newRepetitions = repetitions;
    let newEaseFactor = easeFactor;
    let newInterval = interval;
    if (rating >= 3) {
        if (repetitions === 0) {
            newInterval = 1;
        }
        else if (repetitions === 1) {
            newInterval = 6;
        }
        else {
            newInterval = Math.round(interval * easeFactor);
        }
        newRepetitions = repetitions + 1;
    }
    else {
        newRepetitions = 0;
        newInterval = 1;
    }
    const q = (rating - 1) * (5 / 3);
    newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEaseFactor < 1.3)
        newEaseFactor = 1.3;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + newInterval);
    return {
        repetitions: newRepetitions,
        easeFactor: Math.round(newEaseFactor * 1000) / 1000,
        interval: newInterval,
        dueDate: dueDate.toISOString().split('T')[0],
    };
}

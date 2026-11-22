export interface SubjectMeta {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

export interface ResponsibleCourseMeta {
  readonly subjectId: string;
  readonly ders: string;
  readonly shortName: string;
  readonly termOrder: number | null;
  readonly kredi: number;
  readonly questionCount: number;
}

export interface TermMetric {
  readonly termOrder: number;
  readonly termLabel: string;
  readonly solved: number;
  readonly correct: number;
  readonly percentage: number;
  readonly isCalibrated: boolean;
}

export interface SubjectMetric {
  readonly subjectId: string;
  readonly name: string;
  readonly icon: string;
  readonly solved: number;
  readonly correct: number;
  readonly rematchCount: number;
  readonly percentage: number;
  readonly isCalibrated: boolean;
  readonly isPriority: boolean;
  readonly terms: readonly TermMetric[];
}

export interface CourseMetric {
  readonly subjectId: string;
  readonly subjectName: string;
  readonly icon: string;
  readonly ders: string;
  readonly shortName: string;
  readonly termLabel: string | null;
  readonly kredi: number;
  readonly questionCount: number;
  readonly solved: number;
  readonly correct: number;
  readonly rematchCount: number;
  readonly percentage: number;
  readonly isCalibrated: boolean;
  readonly isPriority: boolean;
}

export interface StudyMetrics {
  readonly hasResponsibleCourses: boolean;
  readonly responsibleCount: number;
  readonly startedCourseCount: number;
  readonly calibratedCourseCount: number;
  readonly unstartedCourseCount: number;
  readonly totalCredits: number;
  readonly totalSolved: number;
  readonly totalCorrect: number;
  readonly totalPercentage: number;
  readonly attemptedPercentage: number;
  readonly isAttemptedCalibrated: boolean;
  readonly isTotalCalibrated: boolean;
  readonly rematchCount: number;
  readonly potentialPercentage: number;
  readonly unresolvedCount: number;
  readonly otherSolvedCount: number;
  readonly courses: readonly CourseMetric[];
  readonly subjects: readonly SubjectMetric[];
}

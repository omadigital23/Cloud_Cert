import training from "./training.json";
import type { CourseModule, TrainingContent } from "./course-types";
import { moduleDetails } from "./modules";

const baseContent = training as TrainingContent;

export const content: TrainingContent = {
  ...baseContent,
  levels: baseContent.levels.map((level) => ({
    ...level,
    modules: level.modules.map((module) => ({
      ...module,
      ...moduleDetails[module.id]
    })) as CourseModule[]
  }))
};

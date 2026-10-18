import { useMemo } from "react";
import { Sparkles, Trophy, Award, Heart, Leaf } from "lucide-react";
import "./VirtualTree.css";

// Growth milestones: points required for each growth stage of the magical tree
const TREE_STAGES = [
  {
    stage: 0,
    title: "Golden Seed",
    height: 35,
    treeEmoji: "🌰",
    environmentEmoji: "🌱",
    leavesCount: 2,
    sparkleCount: 1,
    description: "Your reading seed is sleeping in rich, fertile soil.",
    nextGoal: "Complete 1 story or practice to sprout!",
    pointsNeeded: 0,
    maxPoints: 2,
  },
  {
    stage: 1,
    title: "Little Green Sprout",
    height: 70,
    treeEmoji: "🌱",
    environmentEmoji: "🌿",
    leavesCount: 5,
    sparkleCount: 2,
    description: "Look! Two bright green leaves just pushed through the earth!",
    nextGoal: "Earn 5 garden points to grow a sturdy stem.",
    pointsNeeded: 3,
    maxPoints: 5,
  },
  {
    stage: 2,
    title: "Growing Sapling",
    height: 120,
    treeEmoji: "🌿",
    environmentEmoji: "🦋",
    leavesCount: 9,
    sparkleCount: 4,
    description: "Your tree is growing strong branches and leaves as you practice!",
    nextGoal: "Reach 9 points to bloom radiant flowers.",
    pointsNeeded: 6,
    maxPoints: 9,
  },
  {
    stage: 3,
    title: "Flowering Wonder Tree",
    height: 180,
    treeEmoji: "🌸🌳",
    environmentEmoji: "🌸",
    leavesCount: 14,
    sparkleCount: 6,
    description: "Delicate pink and golden blossoms cover your reading branches!",
    nextGoal: "Reach 14 points to ripen golden wisdom apples.",
    pointsNeeded: 10,
    maxPoints: 14,
  },
  {
    stage: 4,
    title: "Full Blooming Wisdom Oak",
    height: 240,
    treeEmoji: "🌳🍎",
    environmentEmoji: "🍎✨",
    leavesCount: 20,
    sparkleCount: 8,
    description: "A majestic, whispering ancient tree glowing with golden reading apples!",
    nextGoal: "You've grown a legendary Wisdom Tree!",
    pointsNeeded: 15,
    maxPoints: 20,
  },
];

export default function VirtualTree({
  gardenPoints = 0,
  completedStories = 0,
  completedSessions = 0,
  stars = 0,
  childName = "Reader",
}) {
  const currentStageIndex = useMemo(() => {
    for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
      if (gardenPoints >= TREE_STAGES[i].pointsNeeded) {
        return i;
      }
    }
    return 0;
  }, [gardenPoints]);

  const stage = TREE_STAGES[currentStageIndex];
  const nextStage = TREE_STAGES[Math.min(currentStageIndex + 1, TREE_STAGES.length - 1)];

  // Progress percentage to the next tree stage
  const progressPercent = useMemo(() => {
    if (currentStageIndex === TREE_STAGES.length - 1) return 100;
    const currentBase = stage.pointsNeeded;
    const target = nextStage.pointsNeeded;
    const gained = Math.max(0, gardenPoints - currentBase);
    const needed = target - currentBase;
    return Math.min(100, Math.round((gained / needed) * 100));
  }, [gardenPoints, currentStageIndex, stage, nextStage]);

  return (
    <div className="virtual-tree-container">
      {/* HEADER WITH BADGE */}
      <div className="virtual-tree-header">
        <div className="tree-header-text">
          <div className="tree-stage-badge">
            <Leaf size={14} /> <span>STAGE {stage.stage + 1} OF 5</span>
          </div>
          <h3>{childName}'s Magical Reading Tree</h3>
          <p>{stage.description}</p>
        </div>
        <div className="tree-points-pill" title="Garden Points earned from reading">
          <span>🌿 {gardenPoints} Garden Points</span>
        </div>
      </div>

      {/* VIRTUAL TREE CANVAS VISUALIZATION */}
      <div className={`tree-canvas stage-${stage.stage}`}>
        {/* Sky / Floating Particles */}
        <div className="tree-sky-particles">
          {Array.from({ length: stage.sparkleCount }).map((_, i) => (
            <span key={i} className={`floating-sparkle sp-${i}`}>
              ✨
            </span>
          ))}
          {stage.stage >= 2 && <span className="floating-butterfly">🦋</span>}
          {stage.stage >= 3 && <span className="floating-bird">🐦</span>}
        </div>

        {/* Dynamic Tree SVG / Graphic Illustration */}
        <div className="tree-graphic-wrapper">
          <div className={`magical-tree-model stage-visual-${stage.stage}`}>
            {stage.stage === 0 && (
              <div className="seed-model">
                <div className="seed-sprout-head">🌰</div>
                <div className="seed-soil-pile"></div>
              </div>
            )}

            {stage.stage === 1 && (
              <div className="little-sprout-model">
                <div className="sprout-leaf-left">🍃</div>
                <div className="sprout-stem"></div>
                <div className="sprout-leaf-right">🍃</div>
              </div>
            )}

            {stage.stage === 2 && (
              <div className="sapling-model">
                <div className="sapling-canopy">
                  <span>🍃</span>
                  <span>🌿</span>
                  <span>🍃</span>
                </div>
                <div className="sapling-trunk"></div>
              </div>
            )}

            {stage.stage === 3 && (
              <div className="flowering-tree-model">
                <div className="canopy-blossoms">
                  <span>🌸</span>
                  <span>🌿</span>
                  <span>🌸</span>
                  <span>🌸</span>
                </div>
                <div className="flowering-trunk"></div>
              </div>
            )}

            {stage.stage === 4 && (
              <div className="wisdom-tree-model">
                <div className="wisdom-canopy">
                  <div className="canopy-top">🌳</div>
                  <div className="canopy-apples">
                    <span>🍎</span>
                    <span>✨</span>
                    <span>🍎</span>
                    <span>🍎</span>
                  </div>
                </div>
                <div className="wisdom-trunk"></div>
              </div>
            )}
          </div>

          {/* Grassy Ground & Flowers */}
          <div className="tree-ground">
            <div className="ground-grass-patch"></div>
            <div className="ground-flowers">
              <span>🌼</span>
              <span>🌱</span>
              <span>🌸</span>
              <span>🌼</span>
            </div>
          </div>
        </div>

        {/* TREE GROWTH PROGRESS BAR */}
        <div className="tree-progress-box">
          <div className="tree-progress-labels">
            <span>
              Tree Growth: <strong>{stage.title}</strong>
            </span>
            <span>
              {currentStageIndex === TREE_STAGES.length - 1
                ? "Full Bloom ✨"
                : `${gardenPoints} / ${nextStage.pointsNeeded} pts (${progressPercent}%)`}
            </span>
          </div>
          <div className="tree-progress-track">
            <div
              className="tree-progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="next-goal-text">🎯 {stage.nextGoal}</p>
        </div>
      </div>

      {/* READING CARE MILESTONES (HOW CHILD NURTURES THE TREE) */}
      <div className="tree-nurture-stats">
        <div className="nurture-stat">
          <span className="nurture-icon">📖</span>
          <div>
            <strong>{completedStories} Stories Read</strong>
            <small>Gives water to the roots</small>
          </div>
        </div>

        <div className="nurture-stat">
          <span className="nurture-icon">🧩</span>
          <div>
            <strong>{completedSessions} Practice Lessons</strong>
            <small>Gives sunshine for green leaves</small>
          </div>
        </div>

        <div className="nurture-stat">
          <span className="nurture-icon">⭐</span>
          <div>
            <strong>{stars} Learning Stars</strong>
            <small>Provides starlight energy</small>
          </div>
        </div>
      </div>
    </div>
  );
}

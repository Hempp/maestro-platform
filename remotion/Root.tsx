import { Composition } from 'remotion';
import { PhazurWalkthrough } from './compositions/PhazurWalkthrough';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PhazurWalkthrough"
        component={PhazurWalkthrough}
        durationInFrames={1200} // 40 seconds at 30fps (9 scenes with transitions)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

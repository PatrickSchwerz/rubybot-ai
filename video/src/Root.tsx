import { Composition } from "remotion";
import { RubyPromo } from "./RubyPromo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="RubyPromo"
      component={RubyPromo}
      durationInFrames={630}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

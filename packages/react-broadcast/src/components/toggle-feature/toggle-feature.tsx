import { type TFlagName, type TFlagVariation } from '@flopflip/types';
import {
  ToggleFeature as SharedToggleFeature,
  TToggleFeatureProps,
} from '@flopflip/react';
import React from 'react';

import { useFeatureToggle } from '../../hooks/';

type Props = {
  flag: TFlagName;
  variation?: TFlagVariation;
  // eslint-disable-next-line @typescript-eslint/ban-types
} & Omit<TToggleFeatureProps, 'isFeatureEnabled'>;

const ToggleFeature = <OwnProps extends Props>(props: OwnProps) => {
  const isFeatureEnabled = useFeatureToggle(props.flag, props.variation);
  return <SharedToggleFeature {...props} isFeatureEnabled={isFeatureEnabled} />;
};

ToggleFeature.displayName = 'ToggleFeature';

export default ToggleFeature;

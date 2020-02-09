import React from 'react';
import {
  wrapDisplayName,
  setDisplayName,
  DEFAULT_FLAG_PROP_KEY,
} from '@flopflip/react';
import { useFlagVariations } from '../../hooks';
import { TFlagName, TFlagVariation } from '@flopflip/types';

type InjectedProps = {
  [propKey: string]: TFlagVariation;
};

export default <OwnProps extends object>(
  flagName: TFlagName,
  propKey: string = DEFAULT_FLAG_PROP_KEY
) => (
  Component: React.ComponentType<any>
): React.ComponentType<OwnProps & InjectedProps> => {
  const WrappedComponent = (ownProps: OwnProps) => {
    const [flagVariation] = useFlagVariations([flagName]);
    const props = {
      ...ownProps,
      [propKey]: flagVariation,
    };

    return <Component {...props} />;
  };

  setDisplayName(wrapDisplayName(Component, 'injectFeatureToggle'));

  return WrappedComponent;
};

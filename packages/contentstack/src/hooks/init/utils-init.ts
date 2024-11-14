import { messageHandler, cliux, @contentstack/managementSDKInitiator, marketplaceSDKInitiator } from '@contentstack/cli-utilities';

/**
 * Initialize the utilities 
 */
export default function (_opts): void {
  const { context } = this.config;
  messageHandler.init(context);
  cliux.init(context);
  @contentstack/managementSDKInitiator.init(context);
  marketplaceSDKInitiator.init(context);
}

import * as Constants from '../common/constants';
import { MagitState } from '../models/magitState';
import { Section } from './general/sectionHeader';
import { DocumentView } from './general/documentView';
import { Uri } from 'vscode';
import { ChangeSectionView } from './changes/changesSectionView';
import { MagitRepository } from '../models/magitRepository';

export default class StagedView extends DocumentView {

  static UriPath: string = 'staged.magit';

  constructor(uri: Uri, magitState: MagitState) {
    super(uri);
    this.provideContent(magitState, true);
  }

  provideContent(magitState: MagitState, unfoldAll = false) {

    this.subViews = [];
    if (magitState.indexChanges) {

      const stagedSection = new ChangeSectionView(Section.Staged, magitState.indexChanges);

      // Unfold to show diff
      if (unfoldAll) {
        stagedSection.subViews.forEach(changeView => {
          changeView.folded = false;
          changeView.subViews.forEach(hunkView => hunkView.folded = false);
        });
      }

      this.subViews = [
        stagedSection
      ];
    }
  }

  public update(repository: MagitRepository): void {
    if (repository.magitState) {
      this.provideContent(repository.magitState);
    }
    this.triggerUpdate();
  }

  static index = 0;
  static encodeLocation(repository: MagitRepository): Uri {
    return Uri.parse(`${Constants.MagitUriScheme}:${StagedView.UriPath}?${repository.rootUri.fsPath}#${StagedView.index++}`);
  }
}
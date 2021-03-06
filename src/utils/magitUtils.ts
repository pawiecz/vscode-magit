import { MagitRepository } from '../models/magitRepository';
import { magitRepositories, views, gitApi } from '../extension';
import { window, ViewColumn, Uri } from 'vscode';
import { internalMagitStatus } from '../commands/statusCommands';
import { DocumentView } from '../views/general/documentView';
import FilePathUtils from './filePathUtils';

export default class MagitUtils {

  public static getCurrentMagitRepo(uri: Uri): MagitRepository | undefined {

    let repository = magitRepositories.get(uri.query);

    if (!repository) {

      for (const [key, repo] of magitRepositories.entries()) {
        if (FilePathUtils.isDescendant(key, uri.fsPath)) {
          return repo;
        }
      }

      // First time encountering this repo
      repository = gitApi.repositories.find(r => FilePathUtils.isDescendant(r.rootUri.fsPath, uri.fsPath));

      if (repository) {
        magitRepositories.set(repository.rootUri.fsPath, repository);
      }
    }

    return repository;
  }

  public static getCurrentMagitRepoAndView(uri: Uri): [MagitRepository | undefined, DocumentView | undefined] {
    const repository = magitRepositories.get(uri.query);
    const currentView = views.get(uri.toString() ?? '') as DocumentView;
    return [repository, currentView];
  }

  public static async magitStatusAndUpdate(repository: MagitRepository) {
    await internalMagitStatus(repository);
    views.forEach(view => view.needsUpdate ? view.update(repository) : undefined);
  }

  public static magitAnythingModified(repository: MagitRepository): boolean {
    return repository.magitState !== undefined && (
      repository.magitState.indexChanges.length > 0 ||
      repository.magitState.workingTreeChanges.length > 0 ||
      (repository.magitState.mergeChanges?.length ?? 0) > 0);
  }

  public static async chooseRef(repository: MagitRepository, prompt: string, showCurrent = false, showHEAD = false) {

    const refs: string[] = [];

    if (showCurrent && repository.magitState?.HEAD?.name) {
      refs.push(repository.magitState.HEAD.name);
    }

    if (showHEAD) {
      refs.push('HEAD');
    }

    refs.push(...repository.state.refs
      .filter(ref => ref.name !== repository.magitState?.HEAD?.name)
      .sort((refA, refB) => refA.type - refB.type).map(r => r.name!));

    return window.showQuickPick(refs, { placeHolder: prompt });
  }

  public static async confirmAction(prompt: string, hardConfirm: boolean = false) {

    const yesNo = hardConfirm ? 'yes or no' : 'y or n';
    const confirmed = await window.showInputBox({ prompt: `${prompt} (${yesNo})` });
    if ((hardConfirm && confirmed?.toLowerCase() === 'yes') || (!hardConfirm && confirmed?.toLowerCase().charAt(0) === 'y')) {
      return true;
    }
    window.setStatusBarMessage('Abort');
    return false;
  }

  public static oppositeActiveViewColumn(): ViewColumn {
    const activeColumn = window.activeTextEditor?.viewColumn ?? 0;

    if (activeColumn > ViewColumn.One) {
      return ViewColumn.One;
    }
    return ViewColumn.Two;
  }
}
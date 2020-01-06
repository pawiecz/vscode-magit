import { MagitRepository } from "../models/magitRepository";
import { magitRepositories, views } from "../extension";
import { TextEditor, TextDocument } from "vscode";
import { internalMagitStatus } from "../commands/statusCommands";
import { DocumentView } from "../views/general/documentView";
import MagitStatusView from "../views/magitStatusView";

export default class MagitUtils {
  public static getCurrentMagitRepo(document: TextDocument): MagitRepository | undefined {
    return magitRepositories.get(document.uri.query);
  }

  public static getCurrentMagitRepoAndView(editor: TextEditor): [MagitRepository | undefined, DocumentView | undefined] {
    let repository = magitRepositories.get(editor.document.uri.query);
    let currentView = views.get(editor.document.uri.toString() ?? "") as DocumentView;
    return [repository, currentView];
  }

  public static async magitStatusAndUpdate(repository: MagitRepository, view: DocumentView) {

    await internalMagitStatus(repository);

    // TODO: Getting somewhere.. but not perfect

    // GOOD FIRST SOLUTION:

    // A way to route the model to each view for updating them.

    // This might work fine..
    // maybe mark some views as not updateable, as it might not be necessary to update all views

    // view.triggerUpdate(repository);

    // triggerUpdate {
    //    views.set(blabla, new SelfView( extractRelevantPartOfRepositoryModel));
    // }

    views.set(view.uri.toString(), new MagitStatusView(view.uri, repository.magitState!));

    view.triggerUpdate();
  }
}
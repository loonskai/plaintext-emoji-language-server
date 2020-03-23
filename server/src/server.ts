import {
	CompletionItem,
	CompletionList,
	CompletionParams,
	createConnection,
	Diagnostic,
	DidChangeTextDocumentParams,
	Hover,
	IConnection,
	InitializeParams,
	InitializeResult,
	IPCMessageReader,
	IPCMessageWriter,
	TextDocumentContentChangeEvent,
	TextDocumentPositionParams,
	CompletionItemKind
} from 'vscode-languageserver';
import { TextDocumentSyncKind } from 'vscode-languageserver-protocol';
import axios from 'axios';

class EmojiLanguageServer {
	private readonly connection: IConnection;
	private openDocuments: { [documentUri: string]: TextDocumentContentChangeEvent };
	
	constructor() {
		this.connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
		this.openDocuments = {};
	}
	
	public start(): void {
		this.initializeConnection();
		this.connection.listen();
	}

	private initializeConnection(): void {
		const { connection } = this;
		connection.onInitialize(this.onInitialize);

		connection.onDidChangeTextDocument(this.onDidChangeTextDocument);

		connection.onCompletion(this.onCompletion);
		connection.onCompletionResolve(this.onCompletionResolve);
		// connection.onHover(this.onHover);
	}
	
	private onInitialize = (params: InitializeParams): InitializeResult => {
		return {
			capabilities: {
				textDocumentSync: TextDocumentSyncKind.Full,
				hoverProvider: true,
				completionProvider: {
				resolveProvider: true,
				// triggerCharacters: [':']
				}
			}
		};
	}

	private onDidChangeTextDocument = async (event: DidChangeTextDocumentParams): Promise<void> => {
		const {	contentChanges, textDocument	} = event;
		const {	uri	} = textDocument;
		const diagnostics: Diagnostic[] = [];
		this.openDocuments[uri] = contentChanges[0];
		this.connection.sendDiagnostics({uri, diagnostics});
	}

	private onHover = async (event: TextDocumentPositionParams): Promise<Hover | void> => {
		const {	position, textDocument	} = event;
		const {	uri	} = textDocument;
		const document = this.openDocuments[uri];
		let hoverInfo;
		try {
			// hoverInfo = await getHoverInfo(position, document);
		} catch (e) {

		}
		return hoverInfo;
	}

	private onCompletion = async (completionParams: CompletionParams): Promise<CompletionItem[] | CompletionList | null> => {
		const { textDocument } = completionParams;
		const { uri } = textDocument;
		const document = this.openDocuments[uri];
		let items = null;
		try {
			const { text } = document;
			const words = text.match(/\b[a-zA-Z]{2,}/g) || [];
			const lastWord = words[words.length - 1];

			const res = await axios.get('https://www.emojidex.com/api/v1/search/emoji', {
				params: { code_cont: lastWord.trim() }
			});

			const { emoji } = res.data;
			return emoji.filter((item: any) => item.unicode && item.unicode.length === 5).map((item: any) => ({
				label: `${item.moji} ${item.code}`,
				kind: CompletionItemKind.Text,
				detail: item.code,
				insertText: item.moji
			}));
		} catch (e) {

		}
		return items;
	}

	private onCompletionResolve = (completionItem: CompletionItem): CompletionItem => {
		return completionItem;
	}
}

const server = new EmojiLanguageServer();
server.start();
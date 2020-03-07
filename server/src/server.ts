import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
} from 'vscode-languageserver';
import axios from 'axios';

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments = new TextDocuments();

connection.onInitialize((params: InitializeParams) => {
	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			completionProvider: {
				// triggerCharacters: [':'],
				resolveProvider: true
			}
		}
	};
});

connection.onCompletion(
	async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
		const { textDocument } = _textDocumentPosition;
		const doc = documents.get(textDocument.uri);
		if (!doc) return [];
		
		const text = doc.getText();
		const words = text.match(/\b[a-zA-Z]{2,}/g) || [];
		const lastWord = words[words.length - 1];

		const res = await axios.get('https://www.emojidex.com/api/v1/search/emoji', {
			params: { code_cont: lastWord.trim() }
		});
		const { emoji } = res.data;
		if (!emoji) return [];

		return emoji.filter((item: any) => item.unicode && item.unicode.length === 5).map((item: any) => ({
			label: `${item.moji} ${item.code}`,
			kind: CompletionItemKind.Text,
			detail: item.code,
			insertText: item.moji
		}));
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

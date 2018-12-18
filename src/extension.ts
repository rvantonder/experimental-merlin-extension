import * as sourcegraph from 'sourcegraph'
import { ajax } from 'rxjs/ajax'

interface FullSettings {
    endpoint: string
}

type Settings = Partial<FullSettings>

export function activate(): void {
    function afterActivate() {
        // const address = sourcegraph.configuration.get<Settings>().get('endpoint')
        const address = 'https://smee.io/cnUvUrtWnGe8KH1e'
        if (!address) {
            console.log('No endpoint.')
            return
        }

        const docSelector = [{ pattern: '*.{ml, mli}' }]

        sourcegraph.languages.registerHoverProvider(docSelector, {
            provideHover: async (doc, unaligned_pos) => {
                const pos = { line : unaligned_pos.line + 1, character : unaligned_pos.character }
                return ajax({
                    method: 'POST',
                    url: address,
                    body: JSON.stringify({ method: 'hover', doc, pos }),
                    responseType: 'json',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                    .toPromise()
                    .then(response => {
                        return (
                            response &&
                            response.response &&
                            response.response.contents && {
                                contents: {
                                    value: response.response.contents,
                                },
                            }
                        )
                    })
            },
        })
        
        sourcegraph.languages.registerDefinitionProvider(docSelector, {
            provideDefinition: async (doc, unaligned_pos) => {
                const pos = { line : unaligned_pos.line + 1, character : unaligned_pos.character }
                return ajax({
                    method: 'POST',
                    url: address,
                    body: JSON.stringify({ method: 'definition', doc, pos }),
                    responseType: 'json',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                    .toPromise()
                    .then(response => {
                        return (
                            response &&
                            response.response &&
                            new sourcegraph.Location(
                                //new sourcegraph.URI(response.response.uri), // says *buffer* heh
                                new sourcegraph.URI(doc.uri),
                                new sourcegraph.Range(
                                    new sourcegraph.Position(
                                        response.response.range.start.line,
                                        response.response.range.start.character
                                    ),
                                    new sourcegraph.Position(
                                        response.response.range.end.line,
                                        response.response.range.end.character
                                    )
                                )
                            )
                        )
                    })
            },
        })
        
    }
    // Error creating extension host: Error: Configuration is not yet available.
    // `sourcegraph.configuration.get` is not usable until after the extension
    // `activate` function is finished executing. This is a known issue and will
    // be fixed before the beta release of Sourcegraph extensions. In the
    // meantime, work around this limitation by deferring calls to `get`.
    setTimeout(afterActivate, 0)
}

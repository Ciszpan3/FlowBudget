# Import CSV

Import jest dwuetapowy. `/imports/preview` dekoduje plik w pamięci, wykrywa separator, mapuje wskazane nagłówki i zwraca maksymalnie 1000 znormalizowanych wierszy. Nic nie zapisuje. Użytkownik może poprawić kategorię lub pominąć rekord.

`/imports/commit` ponownie waliduje wiersze, sprawdza własność konta, porównuje odciski istniejących operacji i zapisuje batch oraz nowe transakcje atomowo. Odcisk SHA-256 obejmuje użytkownika, konto, datę, kwotę i znormalizowany opis. Surowy plik i jego zawartość nie są logowane ani przechowywane.

Obsługiwane są UTF-8 i Windows-1250, separatory `;`, `,` i tabulator, daty ISO i polskie oraz kwoty ze znakiem. Generyczny mapper oczekuje domyślnie kolumn `Data`, `Opis`, `Kwota`. Adapter iPKO należy dodać dopiero po uzyskaniu zanonimizowanej, zweryfikowanej próbki; nie wolno wnioskować formatu z nazwy banku. Syntetyczne przykłady są w `fixtures/`.

module.exports = {
    numberToWord: async (number) => {
        const units = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
        const teens = ["", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
        const tens = ["", "ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
        const thousands = ["", "thousand", "million", "billion", "trillion"];

        function convertLessThanOneThousand(number) {
            if (number === 0) {
                return "";
            }
            if (number < 10) {
                return units[number];
            }
            if (number < 20) {
                return teens[number - 10];
            }
            if (number < 100) {
                return tens[Math.floor(number / 10)] + " " + units[number % 10];
            }
            return units[Math.floor(number / 100)] + " hundred " + convertLessThanOneThousand(number % 100);
        }

        if (number === 0) {
            return "zero";
        }

        let word = "";
        let index = 0;

        while (number > 0) {
            if (number % 1000 !== 0) {
                word = convertLessThanOneThousand(number % 1000) + " " + thousands[index] + " " + word;
            }
            number = Math.floor(number / 1000);
            index++;
        }

        return word.trim();
    }
}
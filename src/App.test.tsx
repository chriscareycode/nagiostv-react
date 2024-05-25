import { screen, render } from "@testing-library/react";
import App from "./App";

describe("App tests", () => {
	it("should render the title", () => {
		render(<App />);

		// expect(
		//   screen.getByRole("heading", {
		//     level: 1,
		//   })
		// ).toHaveTextContent("Vite + React");

		// Write a test to make sure the div with id="Base" is in the DOM
		expect(screen.getByTestId("Base")).toBeInTheDocument(); // Add toBeInTheDocument to the expect statement

	});
});
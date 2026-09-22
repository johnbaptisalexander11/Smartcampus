import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import ProfilePage from "./modules/auth/pages/ProfilePage";
import * as AuthContextModule from "./context/AuthContext";

test("renders the welcome hero and campus features", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );

  expect(screen.getByText(/welcome to smart campus/i)).toBeInTheDocument();
  expect(screen.getByText(/everything you need on campus/i)).toBeInTheDocument();
  expect(screen.getByText(/food ordering/i)).toBeInTheDocument();
});

test("allows editing and saving profile details", async () => {
  const updateProfile = vi.fn().mockResolvedValue({
    data: { data: { user: { name: "New Name", email: "sara@example.com", phone: "0771234567", department: "IT", studyYear: 2, semester: 1, role: "student" } } },
  });

  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: {
      name: "Sara",
      email: "sara@example.com",
      phone: "0777654321",
      department: "Computer Science",
      studyYear: 1,
      semester: 2,
      role: "student",
      createdAt: "2024-01-15T00:00:00.000Z",
      isActive: true,
    },
    updateProfile,
  });

  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "New Name" } });
  fireEvent.change(screen.getByLabelText(/department/i), { target: { value: "IT" } });
  fireEvent.change(screen.getByLabelText(/study year/i), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText(/semester/i), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

  await waitFor(() => {
    expect(updateProfile).toHaveBeenCalledWith({
      name: "New Name",
      phone: "0777654321",
      department: "IT",
      studyYear: 2,
      semester: 1,
    });
  });
});

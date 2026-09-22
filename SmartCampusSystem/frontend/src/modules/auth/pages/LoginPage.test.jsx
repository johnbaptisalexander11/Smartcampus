import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "./LoginPage";
import { useAuth } from "../../../context/AuthContext";

vi.mock("../../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("LoginPage", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    mockLogin.mockReset();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  const renderLoginPage = () =>
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student/dashboard" element={<div>Student Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

  it("shows validation errors for empty fields", async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("submits valid credentials and navigates to the student dashboard", async () => {
    mockLogin.mockResolvedValue({
      data: {
        data: {
          user: { role: "student" },
        },
      },
    });

    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({
      email: "student@example.com",
      password: "password123",
    }));

    expect(await screen.findByText(/student dashboard/i)).toBeInTheDocument();
  });

  it("shows the backend error message when login fails", async () => {
    mockLogin.mockRejectedValue({
      response: {
        data: {
          message: "Invalid email or password",
        },
      },
    });

    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
